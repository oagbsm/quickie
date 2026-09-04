"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";
import { hashProviderInviteToken, sendProviderInvitationEmail } from "@/lib/server/provider-invitations";
import { sendProviderApprovedEmail } from "@/lib/marketplace/email/transactional";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim();
export async function adminSignOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
export async function createMarketplaceProviderInvitation(f: FormData) {
  const { user } = await requireAdmin();
  const admin = createSupabaseAdminClient();
  const email = value(f, "email").toLowerCase();
  const name = value(f, "name");
  if (!/^\S+@\S+\.\S+$/.test(email) || name.length < 2) redirect("/admin/providers?error=invalid_invite");
  const existing = await admin.from("marketplace_provider_invitations").select("id,status").eq("email", email).in("status", ["pending", "failed"]).maybeSingle();
  if (existing.data) redirect("/admin/providers?error=duplicate_invite");
  const accepted = await admin.from("marketplace_provider_invitations").select("id").eq("email", email).eq("status", "accepted").maybeSingle();
  if (accepted.data) redirect("/admin/providers?error=duplicate_provider");
  const token = randomBytes(32).toString("base64url");
  const invitation = await admin.from("marketplace_provider_invitations").insert({ email, invited_name: name, phone: value(f, "phone") || null, category_slug: value(f, "category").toLowerCase() || null, service_area: value(f, "serviceArea").toUpperCase() || null, token_hash: hashProviderInviteToken(token), expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), invited_by: user.id }).select("id").single();
  if (invitation.error || !invitation.data) redirect("/admin/providers?error=invite_create");
  const sent = await sendProviderInvitationEmail({ invitationId: invitation.data.id, recipient: email, invitedName: name, token });
  revalidatePath("/admin/providers");
  redirect(`/admin/providers?${sent.sent ? "success=invited" : "error=email_failed"}`);
}

export async function revokeMarketplaceProviderInvitation(f: FormData) {
  await requireAdmin();
  const id = value(f, "invitationId");
  const admin = createSupabaseAdminClient();
  await admin.from("marketplace_provider_invitations").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", id).in("status", ["pending", "failed"]);
  revalidatePath("/admin/providers");
  redirect("/admin/providers?success=revoked");
}

export async function resendMarketplaceProviderInvitation(f: FormData) {
  const { user } = await requireAdmin();
  const id = value(f, "invitationId");
  const admin = createSupabaseAdminClient();
  const { data: old } = await admin.from("marketplace_provider_invitations").select("email,invited_name,status").eq("id", id).maybeSingle();
  if (!old || ["accepted", "revoked"].includes(old.status)) redirect("/admin/providers?error=invite_unavailable");
  const token = randomBytes(32).toString("base64url");
  const updated = await admin.from("marketplace_provider_invitations").update({ token_hash: hashProviderInviteToken(token), status: "pending", expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), invited_by: user.id, revoked_at: null, accepted_at: null }).eq("id", id);
  if (updated.error) redirect("/admin/providers?error=invite_update");
  const sent = await sendProviderInvitationEmail({ invitationId: id, recipient: old.email, invitedName: old.invited_name, token });
  revalidatePath("/admin/providers");
  redirect(`/admin/providers?${sent.sent ? "success=resent" : "error=email_failed"}`);
}

export async function updateMarketplaceProviderStatus(f: FormData) {
  const { user } = await requireAdmin();
  const providerId = value(f, "providerId");
  const nextStatus = value(f, "status");
  const reason = value(f, "reason");
  if (!providerId || !["pending_review", "approved", "action_required", "suspended"].includes(nextStatus) || (nextStatus === "action_required" && reason.length < 5)) redirect("/admin/providers?error=invalid_status");
  const admin = createSupabaseAdminClient();
  const { data: current } = await admin.from("marketplace_providers").select("provider_status,stripe_status").eq("user_id", providerId).maybeSingle();
  if (!current) redirect("/admin/providers?error=provider_not_found");
  const update = await admin.from("marketplace_providers").update({ provider_status: nextStatus, marketplace_active: nextStatus === "approved" && current.stripe_status === "ready", action_required_reason: nextStatus === "action_required" ? reason : null, approved_at: nextStatus === "approved" ? new Date().toISOString() : null, suspended_at: nextStatus === "suspended" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("user_id", providerId);
  if (update.error) redirect("/admin/providers?error=status_update");
  const history = await admin.from("marketplace_provider_status_history").insert({ provider_id: providerId, from_status: current.provider_status, to_status: nextStatus, reason: reason || null, changed_by: user.id });
  if (!history.error && current.provider_status !== "approved" && nextStatus === "approved") {
    try {
      await sendProviderApprovedEmail(providerId);
    } catch (error) {
      console.error("marketplace_provider_approval_email_failed", { providerId, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" });
    }
  }
  revalidatePath("/admin/providers"); revalidatePath("/work"); revalidatePath("/work/onboarding");
  redirect("/admin/providers?success=status");
}

export async function setMarketplaceProviderQualification(f: FormData) {
  await requireAdmin();
  const providerId = value(f, "providerId");
  const categorySlug = value(f, "categorySlug");
  const jobTypeSlug = value(f, "jobTypeSlug");
  const verified = value(f, "verified") === "1";
  if (!providerId || !categorySlug || !jobTypeSlug || !["plumbing", "electrical", "smart-home"].includes(categorySlug)) redirect("/admin/providers?error=qualification_update");
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("marketplace_provider_services").update({ qualification_verified: verified }).eq("provider_id", providerId).eq("category_slug", categorySlug).eq("job_type_slug", jobTypeSlug);
  if (error) redirect("/admin/providers?error=qualification_update");
  revalidatePath("/admin/providers");
  redirect("/admin/providers?success=qualification");
}
