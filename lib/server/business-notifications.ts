import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getAppOrigin } from "@/lib/app-url";
function admin() {
  const u = process.env.NEXT_PUBLIC_SUPABASE_URL,
    k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!u || !k) throw new Error("Missing Supabase notification configuration");
  return createClient(u, k, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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
    from = process.env.RESEND_FROM_EMAIL,
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
    from = process.env.RESEND_FROM_EMAIL,
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
