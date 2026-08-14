import "server-only";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { buildAbsoluteAppUrl } from "@/lib/app-url";
import { getResendFromEmail, getResendReplyToEmail } from "@/lib/email-config";

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
export const hashProviderInviteToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const providerInviteUrl = (token: string) => buildAbsoluteAppUrl(`/provider/invite/${encodeURIComponent(token)}`);

export async function acceptProviderInvitation(rawToken: string, user: { id: string; email?: string | null }) {
  const client = db();
  const { data: invitation } = await client.from("marketplace_provider_invitations").select("*").eq("token_hash", hashProviderInviteToken(rawToken)).maybeSingle();
  if (!invitation) return { ok: false as const, error: "invalid" };
  if (invitation.status === "revoked") return { ok: false as const, error: "revoked" };
  if (invitation.status === "accepted") return { ok: false as const, error: "accepted" };
  if (new Date(invitation.expires_at).getTime() <= Date.now()) {
    await client.from("marketplace_provider_invitations").update({ status: "expired" }).eq("id", invitation.id).eq("status", "pending");
    return { ok: false as const, error: "expired" };
  }
  if (!user.email || user.email.trim().toLowerCase() !== invitation.email.trim().toLowerCase()) return { ok: false as const, error: "email_mismatch" };
  const profile = await client.from("cleaner_profiles").upsert({ user_id: user.id, display_name: invitation.invited_name, business_name: invitation.invited_name, service_area: invitation.service_area, marketplace_active: true, updated_at: new Date().toISOString() }, { onConflict: "user_id" }).select("user_id").single();
  if (profile.error) return { ok: false as const, error: "profile" };
  const existingCustomer = await client.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  if (!existingCustomer.data) await client.from("marketplace_customers").insert({ auth_user_id: user.id, email: user.email, display_name: invitation.invited_name, mobile: invitation.phone || null });
  const category = invitation.category_slug?.trim().toLowerCase();
  if (category) {
    await client.from("marketplace_provider_services").upsert({ provider_id: user.id, category_slug: category, job_type_slug: category, active: true }, { onConflict: "provider_id,job_type_slug" });
  }
  for (const area of (invitation.service_area || "").split(/[\s,]+/).map((value: string) => value.trim().toUpperCase()).filter(Boolean)) {
    await client.from("marketplace_provider_service_areas").upsert({ provider_id: user.id, postcode_district: area, active: true }, { onConflict: "provider_id,postcode_district" });
  }
  const updated = await client.from("marketplace_provider_invitations").update({ provider_user_id: user.id, status: "accepted", accepted_at: new Date().toISOString(), last_send_error: null }).eq("id", invitation.id).eq("status", "pending");
  if (updated.error) return { ok: false as const, error: "accept" };
  return { ok: true as const };
}

export async function sendProviderInvitationEmail(input: { invitationId: string; recipient: string; invitedName: string; token: string }) {
  const client = db();
  const attemptedAt = new Date().toISOString();
  await client.from("marketplace_provider_invitations").update({ last_send_attempt_at: attemptedAt, last_send_error: null }).eq("id", input.invitationId);
  const apiKey = process.env.RESEND_API_KEY;
  const from = getResendFromEmail();
  if (!apiKey || !from) {
    const error = !apiKey ? "resend_api_key_missing" : "resend_from_email_missing";
    await client.from("marketplace_provider_invitations").update({ status: "failed", last_send_error: error }).eq("id", input.invitationId);
    return { sent: false as const, error };
  }
  try {
    const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [input.recipient], reply_to: getResendReplyToEmail() || undefined, subject: "You’re invited to join Quickola", html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>You’re invited to join Quickola</h1><p>Hi ${input.invitedName.replace(/[<>]/g, "")}, Quickola has invited you to join as a provider.</p><p><a href="${providerInviteUrl(input.token)}" style="background:#23a955;color:#061b3f;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Join Quickola</a></p><p>This invitation expires in 7 days.</p></div>` }) });
    if (!response.ok) throw new Error(`resend_${response.status}`);
    await client.from("marketplace_provider_invitations").update({ status: "pending", sent_at: new Date().toISOString(), last_send_error: null }).eq("id", input.invitationId);
    return { sent: true as const };
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 120) : "delivery_failed";
    await client.from("marketplace_provider_invitations").update({ status: "failed", last_send_error: reason }).eq("id", input.invitationId);
    return { sent: false as const, error: reason };
  }
}
