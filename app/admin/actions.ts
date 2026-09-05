"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "node:crypto";
import { hashProviderInviteToken, sendProviderInvitationEmail } from "@/lib/server/provider-invitations";
import { sendProviderApprovedEmail } from "@/lib/marketplace/email/transactional";
import { issueMarketplaceRefund } from "@/lib/server/marketplace-refunds";
import { reconcileMarketplaceProviderTransfer, transferMarketplaceProviderFunds } from "@/lib/server/marketplace-transfers";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
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

export async function issueMarketplaceBookingRefund(f: FormData) {
  const { user } = await requireAdmin();
  const bookingId = value(f, "bookingId");
  const amountPence = Math.round(Number(value(f, "amountPence")));
  const reason = value(f, "reason");
  if (!bookingId || !Number.isSafeInteger(amountPence) || amountPence <= 0 || !reason) redirect("/admin/marketplace-bookings?error=refund");
  try {
    const result = await issueMarketplaceRefund(bookingId, amountPence, reason, user.id);
    await createSupabaseAdminClient().from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_refund_requested", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: null, new_value: { amount_pence: amountPence, reason, status: result.status, refund_id: result.refundId || null } });
  } catch (error) {
    console.error("marketplace_refund_failed", { bookingId, reason: error instanceof Error ? error.message : "unknown" });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
  }
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`);
  revalidatePath("/admin/payments");
  redirect(`/admin/marketplace-bookings/${bookingId}?success=refund`);
}

export async function reconcileMarketplaceBookingTransfer(f: FormData) {
  const { user } = await requireAdmin();
  const bookingId = value(f, "bookingId");
  if (!bookingId) redirect("/admin/marketplace-bookings");
  try {
    const result = await reconcileMarketplaceProviderTransfer(bookingId);
    await createSupabaseAdminClient().from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_transfer_reconciled", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: null, new_value: { status: result.status, transfer_id: result.transferId || null } });
  } catch (error) {
    console.error("marketplace_transfer_reconciliation_failed", { bookingId, reason: error instanceof Error ? error.message : "unknown" });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=transfer`);
  }
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`);
  redirect(`/admin/marketplace-bookings/${bookingId}`);
}

export async function retryMarketplaceProviderTransfer(f: FormData) {
  const { user } = await requireAdmin();
  const bookingId = value(f, "bookingId");
  if (!uuid.test(bookingId)) redirect("/admin/marketplace-bookings?error=transfer");

  const admin = createSupabaseAdminClient();
  const definitiveFailureCodes = ["stripe_balance_insufficient", "stripe_transfer_rejected", "stripe_configuration_failed", "stripe_transfer_failed"];
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,provider_transfer_status,provider_transfer_error,stripe_transfer_id").eq("id", bookingId).maybeSingle();
  if (error || !booking || booking.provider_transfer_status !== "failed" || !definitiveFailureCodes.includes(booking.provider_transfer_error || "") || booking.stripe_transfer_id) {
    redirect(`/admin/marketplace-bookings/${bookingId}?error=transfer_unavailable`);
  }

  let result;
  try {
    result = await transferMarketplaceProviderFunds(bookingId);
  } catch (retryError) {
    console.error("marketplace_transfer_retry_failed", { bookingId, reason: retryError instanceof Error ? retryError.message.slice(0, 120) : "unknown" });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=transfer`);
  }
  await admin.from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_transfer_retry", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: { provider_transfer_status: "failed" }, new_value: { status: result.status, transfer_id: result.transferId || null } });
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`);
  redirect(`/admin/marketplace-bookings/${bookingId}?${result.status === "paid" ? "success=transfer" : "error=transfer"}`);
}

export async function cancelMarketplaceBookingAsAdmin(f: FormData) {
  const { user, supabase } = await requireAdmin();
  const bookingId = value(f, "bookingId");
  const reasonCode = value(f, "reasonCode");
  const reasonText = value(f, "reasonText");
  if (!bookingId || !reasonCode || !reasonText) redirect(`/admin/marketplace-bookings/${bookingId}?error=cancel`);
  const { data, error } = await supabase.rpc("cancel_marketplace_booking", { target_booking: bookingId, reason_code: reasonCode, reason_text: reasonText });
  if (error) redirect(`/admin/marketplace-bookings/${bookingId}?error=cancel`);
  await createSupabaseAdminClient().from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_booking_cancelled", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: null, new_value: { status: data?.status || "cancelled", reason_code: reasonCode, reason_text: reasonText } });
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`); revalidatePath("/admin/marketplace-bookings");
  redirect(`/admin/marketplace-bookings/${bookingId}?success=cancel`);
}

export async function holdMarketplacePayout(f: FormData) {
  const { user } = await requireAdmin();
  const bookingId = value(f, "bookingId"); const reason = value(f, "reason");
  if (!bookingId || !reason) redirect(`/admin/marketplace-bookings/${bookingId}?error=hold`);
  const admin = createSupabaseAdminClient();
  const update = await admin.from("marketplace_bookings").update({ payout_hold_status: "held", payout_hold_reason: reason, payout_hold_at: new Date().toISOString(), payout_hold_by: user.id, updated_at: new Date().toISOString() }).eq("id", bookingId).eq("payout_hold_status", "none");
  if (update.error) redirect(`/admin/marketplace-bookings/${bookingId}?error=hold`);
  await admin.from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_payout_held", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: { payout_hold_status: "none" }, new_value: { payout_hold_status: "held", reason } });
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`); redirect(`/admin/marketplace-bookings/${bookingId}`);
}

export async function releaseMarketplacePayoutHold(f: FormData) {
  const { user, supabase } = await requireAdmin(); const bookingId = value(f, "bookingId");
  if (!bookingId) redirect("/admin/marketplace-bookings");
  const admin = createSupabaseAdminClient();
  const { error } = await supabase.rpc("release_marketplace_payout_hold", { target_booking: bookingId });
  if (error) redirect(`/admin/marketplace-bookings/${bookingId}?error=hold`);
  await admin.from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_payout_hold_released", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: { payout_hold_status: "held" }, new_value: { payout_hold_status: "none" } });
  revalidatePath(`/admin/marketplace-bookings/${bookingId}`); redirect(`/admin/marketplace-bookings/${bookingId}`);
}

export async function resolveMarketplaceDispute(f: FormData) {
  const { user, supabase } = await requireAdmin();
  const disputeId = value(f, "disputeId"); const resolutionStatus = value(f, "resolutionStatus"); const resolutionCode = value(f, "resolutionCode"); const resolutionNotes = value(f, "resolutionNotes");
  if (!disputeId || !resolutionCode || !["resolved_provider", "resolved_customer", "closed"].includes(resolutionStatus)) redirect("/admin/marketplace-bookings?error=dispute");
  const { data: dispute, error } = await supabase.rpc("resolve_marketplace_dispute", { target_dispute: disputeId, resolution_status: resolutionStatus, resolution_code: resolutionCode, resolution_notes: resolutionNotes || null });
  if (error) redirect("/admin/marketplace-bookings?error=dispute");
  await createSupabaseAdminClient().from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_dispute_resolved", entity_type: "marketplace_dispute", entity_id: disputeId, previous_value: null, new_value: { booking_id: dispute?.booking_id, status: resolutionStatus, resolution_code: resolutionCode } });
  revalidatePath("/admin/marketplace-bookings"); redirect("/admin/marketplace-bookings");
}
