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
import { parseGbpToPence } from "@/lib/marketplace/money";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function safeDisputeResolutionError(error: unknown) {
  const candidate = error && typeof error === "object" ? error as { code?: unknown; message?: unknown; details?: unknown; hint?: unknown } : {};
  return { code: typeof candidate.code === "string" ? candidate.code.slice(0, 80) : null, message: typeof candidate.message === "string" ? candidate.message.slice(0, 200) : error instanceof Error ? error.message.slice(0, 200) : "unknown", details: typeof candidate.details === "string" ? candidate.details.slice(0, 200) : null, hint: typeof candidate.hint === "string" ? candidate.hint.slice(0, 200) : null };
}
function logDisputeResolution(input: { bookingId: string | null; disputeId: string; outcome: string; stage: string; result?: unknown; error?: unknown; completionStatus?: unknown; payoutHoldStatus?: unknown; disputeStatus?: unknown }) {
  console.error("[marketplace-dispute-resolution]", { bookingId: input.bookingId, disputeId: input.disputeId, outcome: input.outcome, stage: input.stage, result: typeof input.result === "string" ? input.result.slice(0, 120) : input.result === undefined ? null : "present", error: input.error ? safeDisputeResolutionError(input.error) : null, resultingCompletionStatus: input.completionStatus ?? null, resultingPayoutHoldStatus: input.payoutHoldStatus ?? null, resultingDisputeStatus: input.disputeStatus ?? null });
}
function firstRpcRow(data: unknown): { id?: unknown; booking_id?: unknown; status?: unknown } | null {
  if (Array.isArray(data)) return data.length === 1 && data[0] && typeof data[0] === "object" ? data[0] as { id?: unknown; booking_id?: unknown; status?: unknown } : null;
  return data && typeof data === "object" ? data as { id?: unknown; booking_id?: unknown; status?: unknown } : null;
}
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
  const amountPence = parseGbpToPence(value(f, "amountGbp")) ?? (value(f, "amountPence") ? Number(value(f, "amountPence")) : null);
  const reason = value(f, "reason");
  if (!bookingId || amountPence === null || !Number.isSafeInteger(amountPence) || amountPence <= 0 || !reason) {
    console.error("[marketplace-refund]", { bookingId: bookingId || undefined, stage: "admin_input_validation", requestedRefundAmountPence: amountPence, error: { code: "refund_input_invalid", message: "Refund amount and reason are required" } });
    redirect("/admin/marketplace-bookings?error=refund");
  }
  try {
    const result = await issueMarketplaceRefund(bookingId, amountPence, reason, user.id);
    await createSupabaseAdminClient().from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_refund_requested", entity_type: "marketplace_booking", entity_id: bookingId, previous_value: null, new_value: { amount_pence: amountPence, reason, status: result.status, refund_id: result.refundId || null } });
    if (result.status === "succeeded") {
      const admin = createSupabaseAdminClient();
      const { data: dispute, error: disputeLookupError } = await admin.from("marketplace_disputes").select("id").eq("booking_id", bookingId).in("status", ["open", "in_review"]).maybeSingle();
      if (disputeLookupError) {
        console.error("[marketplace-refund]", { bookingId, stage: "dispute_lookup_after_refund", result: "refund_succeeded_dispute_unresolved", error: { code: disputeLookupError.code, message: disputeLookupError.message.slice(0, 240) } });
        redirect(`/admin/marketplace-bookings/${bookingId}?error=dispute`);
      }
      if (dispute) {
        const { error: resolutionError } = await (await createSupabaseServerClient()).rpc("resolve_marketplace_dispute", { target_dispute: dispute.id, p_resolution_status: "resolved_customer", p_resolution_code: "customer_refund", p_resolution_notes: reason.slice(0, 2000) });
        if (resolutionError) {
          console.error("[marketplace-refund]", { bookingId, stage: "dispute_resolution_after_refund", result: "refund_succeeded_dispute_unresolved", error: { code: resolutionError.code, message: resolutionError.message.slice(0, 240) } });
          redirect(`/admin/marketplace-bookings/${bookingId}?error=dispute`);
        }
      }
    }
  } catch (error) {
    console.error("[marketplace-refund]", { bookingId, stage: "admin_action_failure", requestedRefundAmountPence: amountPence, error: { name: error instanceof Error ? error.name : "UnknownError", message: error instanceof Error ? error.message.slice(0, 240) : "unknown" } });
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
  if (data?.payment_status === "refund_pending") {
    try {
      const refund = await issueMarketplaceRefund(bookingId, Number(data.amount_pence || 0) - Number(data.refunded_amount_pence || 0), "Full refund after admin cancellation", user.id);
      if (refund.status === "failed") redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
    } catch (refundError) {
      console.error("marketplace_cancellation_refund_failed", { bookingId, reason: refundError instanceof Error ? refundError.message.slice(0, 160) : "unknown" });
      redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
    }
  }
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
  const disputeId = value(f, "disputeId");
  const resolutionChoice = value(f, "resolutionChoice");
  const resolutionNotes = value(f, "resolutionNotes").slice(0, 2000);
  const resolutionStatus = resolutionChoice === "continue" ? "resolved_provider" : resolutionChoice === "refund" ? "resolved_customer" : "";
  if (!disputeId || !resolutionStatus) redirect("/admin/marketplace-bookings?error=dispute");
  const admin = createSupabaseAdminClient();
  const before = await admin.from("marketplace_disputes").select("id,booking_id,status").eq("id", disputeId).maybeSingle();
  const bookingId = before.data?.booking_id || null;
  if (before.error || !before.data) {
    logDisputeResolution({ bookingId, disputeId, outcome: resolutionChoice, stage: "preflight_dispute_lookup", error: before.error || new Error("dispute_not_found") });
    redirect(bookingId ? `/admin/marketplace-bookings/${bookingId}?error=dispute` : "/admin/marketplace-bookings?error=dispute");
  }
  const beforeBooking = await admin.from("marketplace_bookings").select("id,job_id,amount_pence,refunded_amount_pence,payment_status,status,completion_status,payout_hold_status,payout_hold_reason").eq("id", bookingId).maybeSingle();
  if (beforeBooking.error || !beforeBooking.data) {
    logDisputeResolution({ bookingId, disputeId, outcome: resolutionChoice, stage: "preflight_booking_lookup", error: beforeBooking.error || new Error("booking_not_found") });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=dispute`);
  }
  let refundStatus: string | null = null;
  if (resolutionChoice === "refund") {
    const remaining = Number(beforeBooking.data.amount_pence || 0) - Number(beforeBooking.data.refunded_amount_pence || 0);
    const refundMode = value(f, "refundMode") || "full";
    const requestedAmount = refundMode === "full" ? remaining : parseGbpToPence(value(f, "refundAmountGbp"));
    if (!requestedAmount || requestedAmount <= 0 || requestedAmount > remaining) redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
    try {
      const refund = await issueMarketplaceRefund(bookingId, requestedAmount, resolutionNotes || "Customer refund after dispute resolution", user.id);
      refundStatus = refund.status;
      if (refund.status !== "succeeded") redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
    } catch (refundError) {
      console.error("[marketplace-refund]", { bookingId, stage: "dispute_refund_before_resolution", result: "not_resolved", error: { name: refundError instanceof Error ? refundError.name : "UnknownError", message: refundError instanceof Error ? refundError.message.slice(0, 240) : "unknown" } });
      redirect(`/admin/marketplace-bookings/${bookingId}?error=refund`);
    }
  }
  const { data: rpcData, error } = await supabase.rpc("resolve_marketplace_dispute", { target_dispute: disputeId, p_resolution_status: resolutionStatus, p_resolution_code: resolutionChoice === "continue" ? "job_can_continue" : "customer_refund", p_resolution_notes: resolutionNotes || null });
  const rpcRow = firstRpcRow(rpcData);
  if (error || !rpcRow || rpcRow.id !== disputeId || rpcRow.booking_id !== bookingId || rpcRow.status !== resolutionStatus) {
    logDisputeResolution({ bookingId, disputeId, outcome: resolutionChoice, stage: "rpc_result_validation", result: rpcRow ? "invalid" : null, error: error || new Error("invalid_rpc_result") });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=dispute`);
  }

  const [afterDispute, afterBooking] = await Promise.all([
    admin.from("marketplace_disputes").select("id,booking_id,status").eq("id", disputeId).maybeSingle(),
    admin.from("marketplace_bookings").select("id,job_id,amount_pence,refunded_amount_pence,payment_status,status,completion_status,payout_hold_status,payout_hold_reason").eq("id", bookingId).maybeSingle(),
  ]);
  const booking = afterBooking.data;
  const validContinue = resolutionChoice !== "continue" || Boolean(afterDispute.data && booking && afterDispute.data.status === "resolved_provider" && booking.payment_status === "paid" && booking.status === "awaiting_customer_completion" && booking.completion_status === "awaiting_customer_completion" && booking.refunded_amount_pence === beforeBooking.data.refunded_amount_pence && booking.status !== "completed" && booking.status !== "cancelled" && booking.payout_hold_reason !== "unresolved_dispute");
  const validRefund = resolutionChoice !== "refund" || Boolean(afterDispute.data && booking && afterDispute.data.status === "resolved_customer");
  if (afterDispute.error || afterBooking.error || !afterDispute.data || !booking || !validContinue || !validRefund) {
    logDisputeResolution({ bookingId, disputeId, outcome: resolutionChoice, stage: "persisted_state_validation", error: afterDispute.error || afterBooking.error || new Error("invalid_persisted_transition"), completionStatus: booking?.completion_status, payoutHoldStatus: booking?.payout_hold_status, disputeStatus: afterDispute.data?.status });
    redirect(`/admin/marketplace-bookings/${bookingId}?error=dispute`);
  }
  logDisputeResolution({ bookingId, disputeId, outcome: resolutionChoice, stage: "persisted_state_validated", result: "success", completionStatus: booking.completion_status, payoutHoldStatus: booking.payout_hold_status, disputeStatus: afterDispute.data.status });
  if (resolutionChoice === "refund" && refundStatus !== "succeeded") {
    const remaining = Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0);
    const refundMode = value(f, "refundMode") || "full";
    const requestedAmount = refundMode === "full" ? remaining : parseGbpToPence(value(f, "refundAmountGbp"));
    if (!requestedAmount || requestedAmount <= 0 || requestedAmount > remaining) redirect(`/admin/marketplace-bookings/${booking.id}?error=refund`);
    let refundFailure = false;
    try {
      const refund = await issueMarketplaceRefund(booking.id, requestedAmount, resolutionNotes || "Customer refund after dispute resolution", user.id);
      refundStatus = refund.status;
      refundFailure = refund.status === "failed";
    } catch (refundError) {
      console.error("marketplace_dispute_refund_failed", { disputeId, bookingId: booking.id, reason: refundError instanceof Error ? refundError.message.slice(0, 120) : "unknown" });
      refundFailure = true;
    }
    if (refundFailure) redirect(`/admin/marketplace-bookings/${booking.id}?error=refund`);
  }
  await admin.from("admin_audit_log").insert({ admin_user_id: user.id, action: "marketplace_dispute_resolved", entity_type: "marketplace_dispute", entity_id: disputeId, previous_value: null, new_value: { booking_id: booking.id, status: resolutionStatus, outcome: resolutionChoice, refund_status: refundStatus } });
  const { data: job } = await admin.from("marketplace_jobs").select("public_token").eq("id", booking.job_id).maybeSingle();
  revalidatePath(`/admin/marketplace-bookings/${booking.id}`);
  revalidatePath("/admin/marketplace-bookings");
  revalidatePath(`/work/jobs/${booking.job_id}`);
  if (job?.public_token) { revalidatePath(`/jobs/${job.public_token}`); revalidatePath("/my-jobs"); }
  redirect(`/admin/marketplace-bookings/${booking.id}?success=${resolutionChoice === "continue" ? "dispute_continue" : refundStatus === "already_processing" ? "refund_pending" : "refund"}`);
}
