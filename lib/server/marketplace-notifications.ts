import "server-only";
import { createClient } from "@supabase/supabase-js";
import { buildAbsoluteAppUrl, getTransactionalEmailOrigin } from "@/lib/app-url";
import { getResendFromEmail, getResendReplyToEmail } from "@/lib/email-config";

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
}
const domain = (email: string) => email.trim().toLowerCase().split("@").at(-1) || "unknown";

export async function sendMarketplaceCustomerEmail(input: { customerId: string; jobId: string; eventType: string; recipient: string; idempotencyKey: string; subject: string; html: string }) {
  const client = db();
  const { data: delivery, error: reserveError } = await client.from("marketplace_email_deliveries").insert({ customer_id: input.customerId, job_id: input.jobId, event_type: input.eventType, recipient: input.recipient, idempotency_key: input.idempotencyKey }).select("id").maybeSingle();
  if (reserveError?.code === "23505") return { sent: false as const, status: "skipped" as const, reason: "already_sent" as const };
  if (reserveError || !delivery) return { sent: false as const, status: "failed" as const, reason: "reservation_failed" as const };
  const apiKey = process.env.RESEND_API_KEY;
  const from = getResendFromEmail();
  const origin = getTransactionalEmailOrigin({ appUrl: process.env.APP_URL, siteUrl: process.env.NEXT_PUBLIC_SITE_URL, nodeEnv: process.env.NODE_ENV });
  if (!apiKey || !from || !origin) {
    await client.from("marketplace_email_deliveries").update({ delivery_status: "failed", error_category: !apiKey ? "resend_api_key_missing" : !from ? "resend_from_email_missing" : "invalid_app_origin" }).eq("id", delivery.id);
    console.info("marketplace_email_delivery", { eventType: input.eventType, status: "failed", recipientDomain: domain(input.recipient) });
    return { sent: false as const, status: "failed" as const, reason: "email_not_configured" as const };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.recipient], reply_to: getResendReplyToEmail() || undefined, subject: input.subject, html: input.html }) });
    const body = await response.json().catch(() => ({})) as { id?: string };
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await client.from("marketplace_email_deliveries").update({ delivery_status: "sent", provider_message_id: body.id || null, sent_at: new Date().toISOString() }).eq("id", delivery.id);
    console.info("marketplace_email_delivery", { eventType: input.eventType, status: "sent", recipientDomain: domain(input.recipient) });
    return { sent: true as const, status: "sent" as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 80) : "delivery_failed";
    await client.from("marketplace_email_deliveries").update({ delivery_status: "failed", error_category: reason }).eq("id", delivery.id);
    console.error("marketplace_email_delivery_failed", { eventType: input.eventType, reason, recipientDomain: domain(input.recipient) });
    return { sent: false as const, status: "failed" as const, reason };
  }
}

export function marketplaceJobUrl(token: string) {
  return buildAbsoluteAppUrl(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
}
