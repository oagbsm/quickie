import "server-only";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { buildAbsoluteAppUrl, getAppOrigin } from "@/lib/app-url";
import {
  getResendFromEmail,
  getResendReplyToEmail,
} from "@/lib/email-config";
function admin() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL,
    k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!u || !k) throw new Error("Missing Supabase notification configuration");
  return createClient(u, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
type TransactionalEmailInput = {
  accountId: string;
  eventType: string;
  entityId?: string | null;
  recipient: string;
  idempotencyKey: string;
  subject: string;
  html: string;
};

function recipientDomain(recipient: string) {
  return recipient.trim().toLowerCase().split("@").at(-1) || "unknown";
}

function senderAddress(from: string) {
  const match = from.match(/<([^>]+)>$/);
  return (match?.[1] || from).trim();
}

function deliveryEvent(input: TransactionalEmailInput, status: string, details: Record<string, unknown> = {}) {
  console.info("transactional_email_delivery", {
    event: input.eventType === "cleaner_invitation" ? "cleaner_invitation_email" : "transactional_email",
    status,
    eventType: input.eventType,
    accountId: input.accountId,
    entityId: input.entityId || null,
    recipientDomain: recipientDomain(input.recipient),
    ...details,
  });
}

async function sendTransactionalEmail(input: TransactionalEmailInput) {
  let db: ReturnType<typeof admin> | null = null;
  try {
    db = admin();
    const { error: reserveError } = await db.from("transactional_email_deliveries").insert({
      account_id: input.accountId,
      event_type: input.eventType,
      entity_id: input.entityId || null,
      recipient: input.recipient,
      idempotency_key: input.idempotencyKey,
      delivery_status: "pending",
    });
    if (reserveError?.code === "23505") {
      const { data: previous, error: previousError } = await db
        .from("transactional_email_deliveries")
        .select("id,delivery_status")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (previousError || !previous) {
        deliveryEvent(input, "failed", { failureCategory: "delivery_record_conflict" });
        return { sent: false as const, reason: "reservation_failed" as const };
      }
      if (previous.delivery_status === "sent") {
        deliveryEvent(input, "skipped", { failureCategory: "already_sent" });
        return { sent: false as const, reason: "duplicate" as const };
      }
      if (previous.delivery_status === "pending") {
        deliveryEvent(input, "skipped", { failureCategory: "delivery_in_progress" });
        return { sent: false as const, reason: "duplicate" as const };
      }
      const { error: retryError } = await db
        .from("transactional_email_deliveries")
        .update({ delivery_status: "pending", error_category: null })
        .eq("idempotency_key", input.idempotencyKey)
        .eq("delivery_status", "failed");
      if (retryError) {
        deliveryEvent(input, "failed", { failureCategory: "delivery_record_conflict" });
        return { sent: false as const, reason: "reservation_failed" as const };
      }
    } else if (reserveError) {
      deliveryEvent(input, "failed", { failureCategory: "delivery_record_conflict" });
      return { sent: false as const, reason: "reservation_failed" as const };
    }
    const apiKey = process.env.RESEND_API_KEY;
    const from = getResendFromEmail();
    const replyTo = getResendReplyToEmail();
    if (!apiKey || !from) {
      await db.from("transactional_email_deliveries").update({ delivery_status: "failed", error_category: !apiKey ? "resend_api_key_missing" : "invalid_sender" }).eq("idempotency_key", input.idempotencyKey);
      deliveryEvent(input, "skipped", { failureCategory: !apiKey ? "resend_api_key_missing" : "invalid_sender" });
      return { sent: false as const, reason: "not_configured" as const };
    }
    if (!/^\S+@\S+\.\S+$/.test(senderAddress(from))) {
      await db.from("transactional_email_deliveries").update({ delivery_status: "failed", error_category: "invalid_sender" }).eq("idempotency_key", input.idempotencyKey);
      deliveryEvent(input, "skipped", { failureCategory: "invalid_sender" });
      return { sent: false as const, reason: "not_configured" as const };
    }
    deliveryEvent(input, "attempting");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.recipient], reply_to: replyTo || undefined, subject: input.subject, html: input.html }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const providerMessage = body && typeof body === "object" && "message" in body && typeof body.message === "string"
        ? body.message.slice(0, 240)
        : "provider_rejected";
      const failureCategory = response.status === 401
        ? "resend_api_key_invalid"
        : response.status === 403
          ? "sender_domain_not_verified"
          : response.status === 422
            ? "recipient_or_sender_rejected"
            : response.status === 429
              ? "resend_rate_limited"
              : response.status >= 500
                ? "resend_api_error"
                : "resend_request_rejected";
      console.error("transactional_email_provider_rejected", {
        provider: "resend",
        eventType: input.eventType,
        accountId: input.accountId,
        status: response.status,
        failureCategory,
        message: providerMessage,
      });
      throw new Error(failureCategory);
    }
    await db.from("transactional_email_deliveries").update({ delivery_status: "sent", sent_at: new Date().toISOString(), provider_message_id: typeof body.id === "string" ? body.id : null, error_category: null }).eq("idempotency_key", input.idempotencyKey);
    deliveryEvent(input, "sent", { resendResponseId: typeof body.id === "string" ? body.id : null });
    return { sent: true as const };
  } catch (error) {
    try {
      db ||= admin();
      const failureCategory = error instanceof Error ? error.message : "unknown_delivery_error";
      await db.from("transactional_email_deliveries").update({ delivery_status: "failed", error_category: failureCategory }).eq("idempotency_key", input.idempotencyKey);
      deliveryEvent(input, "failed", { failureCategory });
    } catch { /* email failure must not affect the business action */ }
    console.error("transactional_email_failed", { eventType: input.eventType, accountId: input.accountId, recipientDomain: recipientDomain(input.recipient), failureCategory: error instanceof Error ? error.message : "unknown_delivery_error" });
    return { sent: false as const, reason: "delivery_failed" as const };
  }
}

async function ownerEmail(accountId: string) {
  const db = admin();
  const { data: member } = await db.from("business_members").select("user_id").eq("account_id", accountId).eq("role", "owner").limit(1).maybeSingle();
  if (!member) return null;
  const { data: { user } } = await db.auth.admin.getUserById(member.user_id);
  return user?.email || null;
}

export async function sendCleanerAssignmentEmail({ accountId, turnoverId, workerId, cleanerEmail, cleanerName, propertyName, turnoverDate, checkoutAt, accessStartAt, deadlineAt }: { accountId: string; turnoverId: string; workerId: string; cleanerEmail: string; cleanerName: string; propertyName: string; turnoverDate: string; checkoutAt: string; accessStartAt: string; deadlineAt: string }) {
  const site = getAppOrigin();
  return sendTransactionalEmail({ accountId, eventType: "turnover_assigned", entityId: turnoverId, recipient: cleanerEmail, idempotencyKey: `turnover_assigned:${turnoverId}:${workerId}`, subject: `New turnover assignment: ${propertyName}`, html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>New turnover assignment</h1><p>${escapeHtml(cleanerName)}, you have a new assignment for <strong>${escapeHtml(propertyName)}</strong>.</p><p><strong>Date:</strong> ${escapeHtml(formatLondon(turnoverDate))}<br><strong>Checkout:</strong> ${escapeHtml(formatLondon(checkoutAt))}<br><strong>Cleaner access:</strong> ${escapeHtml(formatLondon(accessStartAt))}<br><strong>Complete by:</strong> ${escapeHtml(formatLondon(deadlineAt))}</p><p><a href="${site}/cleaner/turnovers/${encodeURIComponent(turnoverId)}">Review and accept or decline</a></p></div>` });
}

export async function sendOperatorTurnoverEmail({ accountId, turnoverId, eventType, idempotencyKey, subject, cleanerName, propertyName, turnoverDate, summary, completedCount, evidenceCount }: { accountId: string; turnoverId: string; eventType: string; idempotencyKey: string; subject: string; cleanerName: string; propertyName: string; turnoverDate: string; summary: string; completedCount?: number; evidenceCount?: number }) {
  let recipient: string | null = null;
  try { recipient = await ownerEmail(accountId); } catch { return { sent: false as const, reason: "notification_config" as const }; }
  if (!recipient) return { sent: false as const, reason: "no_recipient" as const };
  const site = getAppOrigin();
  const proof = completedCount === undefined ? "" : `<p><strong>Completed checklist tasks:</strong> ${completedCount}<br><strong>Evidence files:</strong> ${evidenceCount || 0}</p>`;
  return sendTransactionalEmail({ accountId, eventType, entityId: turnoverId, recipient, idempotencyKey, subject, html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>${escapeHtml(subject)}</h1><p><strong>Property:</strong> ${escapeHtml(propertyName)}<br><strong>Cleaner:</strong> ${escapeHtml(cleanerName)}<br><strong>Turnover date:</strong> ${escapeHtml(formatLondon(turnoverDate))}</p><p>${escapeHtml(summary)}</p>${proof}<p><a href="${site}/business/turnovers/${encodeURIComponent(turnoverId)}">Open turnover</a></p></div>` });
}

function formatLondon(value: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(value));
}

export async function sendCleanerInvitationEmail({
  accountId,
  workerId,
  email,
  workspaceName,
  invitationToken,
  expiresAt,
}: {
  accountId: string;
  workerId: string;
  email: string;
  workspaceName: string;
  invitationToken: string;
  expiresAt: string;
}) {
  const acceptUrl = buildAbsoluteAppUrl(`/invite/${encodeURIComponent(invitationToken)}`);
  const tokenHash = cryptoHash(invitationToken);
  return sendTransactionalEmail({ accountId, eventType: "cleaner_invitation", entityId: workerId, recipient: email, idempotencyKey: `cleaner_invitation:${workerId}:${tokenHash}`, subject: `${workspaceName} invited you to Quickola`, html: `<div style="font-family:Arial,sans-serif;color:#071638"><p style="font-size:18px;font-weight:800">Quickola</p><h1>${escapeHtml(workspaceName)} invited you</h1><p>You’ll receive cleaning jobs from ${escapeHtml(workspaceName)} through Quickola.</p><p><a style="display:inline-block;background:#071f49;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold" href="${acceptUrl}">Accept invitation</a></p><p style="color:#657089;font-size:14px">Sent to ${escapeHtml(email)}. This invitation expires ${escapeHtml(new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(expiresAt)))}.</p></div>` });
}

function cryptoHash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}
export async function sendBookingReceivedEmail({
  accountId,
  bookingId,
  propertyId,
  service,
  scheduledStart,
}: {
  accountId: string;
  bookingId: string;
  propertyId: string;
  service: string;
  scheduledStart: string;
}) {
  const apiKey = process.env.RESEND_API_KEY,
    from = getResendFromEmail(),
    replyTo = getResendReplyToEmail(),
    site = getAppOrigin();
  const db = admin(),
    { data: member } = await db
      .from("business_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle(),
    { data: property } = await db
      .from("properties")
      .select("nickname,postcode")
      .eq("id", propertyId)
      .eq("account_id", accountId)
      .maybeSingle();
  if (!member) return { sent: false, reason: "no_recipient" };
  const {
      data: { user },
    } = await db.auth.admin.getUserById(member.user_id),
    email = user?.email;
  if (!email) return { sent: false, reason: "no_email" };
  const { error: reserve } = await db
    .from("business_notifications")
    .insert({
      account_id: accountId,
      booking_id: bookingId,
      notification_type: "booking_received",
      recipient: email,
      channel: "email",
      delivery_status: "pending",
    });
  if (reserve?.code === "23505") return { sent: false, reason: "duplicate" };
  if (reserve) return { sent: false, reason: "reservation_failed" };
  if (!apiKey || !from) {
    await db
      .from("business_notifications")
      .update({ delivery_status: "failed", error: "email_not_configured" })
      .eq("booking_id", bookingId)
      .eq("notification_type", "booking_received");
    return { sent: false, reason: "not_configured" };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `Booking request QK-${bookingId.slice(0, 8).toUpperCase()} received`,
        reply_to: replyTo || undefined,
        html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>We received your cleaning request.</h1><p><strong>Reference:</strong> QK-${bookingId.slice(0, 8).toUpperCase()}</p><p><strong>Property:</strong> ${escapeHtml(property?.nickname || "Property")} (${escapeHtml(property?.postcode || "")})</p><p><strong>Service:</strong> ${escapeHtml(service.replaceAll("_", " "))}</p><p><strong>Requested start:</strong> ${escapeHtml(new Intl.DateTimeFormat("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(scheduledStart)))}</p><p>Quickola will review the appointment details. This is not yet a confirmed appointment.</p><p><a href="${site}/business/bookings/${bookingId}">View booking</a></p></div>`,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await db
      .from("business_notifications")
      .update({
        delivery_status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: typeof body.id === "string" ? body.id : null,
      })
      .eq("booking_id", bookingId)
      .eq("notification_type", "booking_received");
    return { sent: true };
  } catch (error) {
    await db
      .from("business_notifications")
      .update({
        delivery_status: "failed",
        error: error instanceof Error ? error.message : "email_failed",
      })
      .eq("booking_id", bookingId)
      .eq("notification_type", "booking_received");
    return { sent: false, reason: "delivery_failed" };
  }
}
export async function sendPropertyReadyEmail({
  accountId,
  bookingId,
  propertyName,
  completedAt,
  service,
}: {
  accountId: string;
  bookingId: string;
  propertyName: string;
  completedAt: string;
  service: string;
}) {
  const apiKey = process.env.RESEND_API_KEY,
    from = getResendFromEmail(),
    replyTo = getResendReplyToEmail(),
    site = getAppOrigin();
  if (!apiKey || !from) return { sent: false, reason: "not_configured" };
  const db = admin(),
    { data: member } = await db
      .from("business_members")
      .select("user_id")
      .eq("account_id", accountId)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
  if (!member) return { sent: false, reason: "no_recipient" };
  const {
      data: { user },
    } = await db.auth.admin.getUserById(member.user_id),
    email = user?.email;
  if (!email) return { sent: false, reason: "no_email" };
  const { error: reserveError } = await db
    .from("business_notifications")
    .insert({
      account_id: accountId,
      booking_id: bookingId,
      notification_type: "property_ready",
      recipient: email,
      channel: "email",
      delivery_status: "pending",
    });
  if (reserveError?.code === "23505")
    return { sent: false, reason: "duplicate" };
  if (reserveError) return { sent: false, reason: "reservation_failed" };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: replyTo || undefined,
        subject: `${propertyName} is ready`,
        html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>Your property is ready.</h1><p><strong>${escapeHtml(propertyName)}</strong> was completed at ${escapeHtml(new Date(completedAt).toLocaleString("en-GB"))}.</p><p>Cleaning type: ${escapeHtml(service.replaceAll("_", " "))}</p><p><a href="${site}/business/bookings/${bookingId}">View protected completion details</a></p></div>`,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await db
      .from("business_notifications")
      .update({
        delivery_status: "sent",
        sent_at: new Date().toISOString(),
        provider_message_id: typeof body.id === "string" ? body.id : null,
      })
      .eq("booking_id", bookingId)
      .eq("notification_type", "property_ready")
      .eq("recipient", email)
      .eq("channel", "email");
    return { sent: true };
  } catch (error) {
    await db
      .from("business_notifications")
      .update({
        delivery_status: "failed",
        error: error instanceof Error ? error.message : "email_failed",
      })
      .eq("booking_id", bookingId)
      .eq("notification_type", "property_ready")
      .eq("recipient", email)
      .eq("channel", "email");
    return { sent: false, reason: "delivery_failed" };
  }
}
function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char] || char,
  );
}
