"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyCompletionOutcome, notifyFirstMarketplaceOffer } from "@/lib/marketplace/email/transactional";
import { getOperationalMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getOrCreateMarketplaceConversation } from "@/lib/marketplace/conversations";
import { getCurrentAccountRole } from "@/lib/auth/account-role";
import { transferMarketplaceProviderFunds } from "@/lib/server/marketplace-transfers";
import { scheduleDirectChargePayout } from "@/lib/server/marketplace-direct-payouts";
import { issueMarketplaceRefund } from "@/lib/server/marketplace-refunds";

type MarketplaceCompletionStage = "input_validation" | "booking_context_lookup" | "confirm_completion_rpc" | "provider_payout_release" | "completion_notification";

function safeMarketplaceCompletionError(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const text = (key: string) => typeof value[key] === "string" ? String(value[key]).slice(0, 240) : undefined;
  return {
    name: text("name") || "UnknownError",
    message: text("message") || "unknown",
    code: text("code"),
    details: text("details"),
    hint: text("hint"),
  };
}

function logMarketplaceCompletionFailure({ stage, token, jobId, bookingId, error }: { stage: MarketplaceCompletionStage; token: string; jobId?: string | null; bookingId?: string | null; error: unknown }) {
  console.error("[marketplace-completion]", { stage, token, jobId: jobId || undefined, bookingId: bookingId || undefined, ...safeMarketplaceCompletionError(error) });
}

export async function submitMarketplaceOffer(formData: FormData) {
  const token = String(formData.get("token") || "");
  const amount = Math.round(Number(formData.get("amount") || 0) * 100);
  const message = String(formData.get("message") || "").trim();
  const availability = String(formData.get("availability") || "Flexible").trim();
  const scheduledDate = String(formData.get("scheduledDate") || "").trim();
  const arrivalWindowStart = String(formData.get("arrivalWindowStart") || "").trim();
  const arrivalWindowEnd = String(formData.get("arrivalWindowEnd") || "").trim();
  if (!token || !Number.isFinite(amount) || amount <= 0) redirect(`/jobs/${token}?error=offer`);
  const provider = await getOperationalMarketplaceProvider();
  if (!provider) redirect(`/jobs/${token}?error=provider_not_ready`);
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id").eq("public_token", token).maybeSingle();
  if (!job) redirect(`/jobs/${token}?error=offer`);
  const { error } = await supabase.rpc("submit_marketplace_quote", { target_job: job.id, quote_amount: amount, quote_availability: scheduledDate ? "date" : "flexible", quote_available_at: scheduledDate && arrivalWindowStart ? `${scheduledDate}T${arrivalWindowStart}:00Z` : null, quote_availability_text: availability, quote_message: message || null });
  if (error) redirect(`/jobs/${token}?error=${/booked|locked|not_open/i.test(error.message) ? "locked" : "offer"}`);
  if (scheduledDate && arrivalWindowStart && arrivalWindowEnd) await admin.from("marketplace_quotes").update({ scheduled_date: scheduledDate, arrival_window_start: arrivalWindowStart, arrival_window_end: arrivalWindowEnd }).eq("job_id", job.id).eq("provider_id", provider.providerId);
  try { await notifyFirstMarketplaceOffer(job.id); } catch (notificationError) { console.error("marketplace_offer_email_failed", { jobId: job.id, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }
  redirect(`/jobs/${token}?offered=1`);
}

export async function chooseMarketplaceQuote(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const returnTo = String(formData.get("returnTo") || "");
  if (!token || !quoteId) redirect("/");
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const { data: customer } = await admin.from("marketplace_customers").select("id,email").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  const { error } = await supabase.rpc("accept_marketplace_offer", { target_quote: quoteId });
  if (error) {
    console.error("[marketplace-payment] Offer acceptance failed", { stage: "accept-offer", token, quoteId, userId: user.id, code: error.code, reason: error.message });
    redirect(returnTo.startsWith("/") ? `${returnTo}?error=selection` : `/jobs/${token}?error=selection`);
  }
  revalidatePath(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : `/jobs/${token}`);
  redirect(`${returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : `/jobs/${token}`}?selected=1`);
}

export async function changeMarketplaceProvider(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  if (!token || !quoteId) redirect(`/jobs/${token}?error=selection`);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  const { error } = await supabase.rpc("change_marketplace_selected_quote", { target_quote: quoteId });
  if (error) {
    console.error("[marketplace-payment] Provider reselection failed", { token, quoteId, userId: user.id, code: error.code, reason: error.message });
    redirect(`/jobs/${token}?error=${/paid|locked|unavailable/i.test(error.message) ? "locked" : "selection"}`);
  }
  revalidatePath(`/jobs/${token}`);
  redirect(`/jobs/${token}?selected=1`);
}

export async function startCustomerConversation(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const providerId = String(formData.get("providerId") || "");
  if (!token || !providerId) redirect(`/jobs/${token}`);
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || customer.id !== job.customer_id) redirect(`/jobs/${token}?error=ownership`);
  let conversation;
  try {
    conversation = await getOrCreateMarketplaceConversation({ jobId: job.id, providerId, actorUserId: user.id, customerId: customer.id });
  } catch (error) {
    console.error("[startCustomerConversation] FAILED", { stage: "resolve-or-create-conversation", customerId: customer.id, jobId: job.id, code: error && typeof error === "object" && "code" in error ? error.code : undefined, message: error instanceof Error ? error.message : "unknown error", details: error && typeof error === "object" && "details" in error ? error.details : undefined, hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined });
    redirect(`/jobs/${token}?error=message`);
  }
  redirect(`/messages/${conversation.id}`);
}

const CUSTOMER_EDITABLE_JOB_STATUSES = ["posted", "finding_provider", "provider_available"];

async function getOwnedEditableJob(token: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();
  const { data: customer } = user ? await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle() : { data: null };
  const { data: job } = token && customer ? await admin.from("marketplace_jobs").select("id,customer_id,status").eq("public_token", token).maybeSingle() : { data: null };
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  if (!CUSTOMER_EDITABLE_JOB_STATUSES.includes(job.status)) redirect(`/jobs/${token}?error=job_locked`);
  const [{ data: acceptedQuote }, { data: booking }] = await Promise.all([
    admin.from("marketplace_quotes").select("id").eq("job_id", job.id).in("status", ["accepted", "selected"]).maybeSingle(),
    admin.from("marketplace_bookings").select("id,payment_status").eq("job_id", job.id).maybeSingle(),
  ]);
  if (acceptedQuote || booking) redirect(`/jobs/${token}?error=job_locked`);
  return { admin, job };
}

export async function cancelCustomerMarketplaceJob(formData: FormData) {
  const token = String(formData.get("token") || "");
  const reasonText = String(formData.get("reasonText") || "").trim().slice(0, 2000);
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createSupabaseAdminClient();
  const { data: customer } = user ? await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle() : { data: null };
  const { data: job } = token && customer ? await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle() : { data: null };
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  const { error } = await supabase.rpc("cancel_marketplace_job_before_payment", { target_job: job.id, reason_text: reasonText || null });
  if (error) redirect(`/jobs/${token}?error=cancel`);
  revalidatePath(`/jobs/${token}`);
  revalidatePath("/my-jobs");
  redirect(`/jobs/${token}`);
}

export async function updateCustomerMarketplaceJob(formData: FormData) {
  const token = String(formData.get("token") || "");
  const optionalNote = String(formData.get("optionalNote") || "").trim().slice(0, 4000);
  const requestedTiming = String(formData.get("requestedTiming") || "").trim().slice(0, 160);
  const budgetRaw = String(formData.get("budgetAmount") || "").trim();
  const budgetAmount = budgetRaw ? Number(budgetRaw) : null;
  if (budgetAmount !== null && (!Number.isFinite(budgetAmount) || budgetAmount < 0 || budgetAmount > 1000000)) redirect(`/jobs/${token}?error=edit`);
  const { admin, job } = await getOwnedEditableJob(token);
  const { error } = await admin.from("marketplace_jobs").update({ optional_note: optionalNote || null, requested_timing: requestedTiming || null, budget_amount: budgetAmount }).eq("id", job.id).in("status", CUSTOMER_EDITABLE_JOB_STATUSES);
  if (error) redirect(`/jobs/${token}?error=edit`);
  revalidatePath(`/jobs/${token}`);
  revalidatePath("/my-jobs");
  redirect(`/jobs/${token}`);
}

export async function confirmMarketplaceCompletion(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const bookingId = String(formData.get("bookingId") || "");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !token || !bookingId) redirect(`/jobs/${token}`);
  const admin = createSupabaseAdminClient();
  const { data: bookingContext, error: bookingContextError } = await admin.from("marketplace_bookings").select("id,job_id,payment_flow").eq("id", bookingId).maybeSingle();
  if (bookingContextError) logMarketplaceCompletionFailure({ stage: "booking_context_lookup", token, bookingId, error: bookingContextError });
  const jobId = bookingContext?.job_id || null;
  const { error } = await supabase.rpc("confirm_marketplace_completion", { target_booking: bookingId });
  if (error) {
    logMarketplaceCompletionFailure({ stage: "confirm_completion_rpc", token, jobId, bookingId, error });
    redirect(`/jobs/${token}?error=completion`);
  }
  let transferStatus: "paid" | "blocked" | "failed" | "already_processing" = "failed";
  try {
    if (bookingContext?.payment_flow === "direct_charge") {
      await scheduleDirectChargePayout(bookingId);
      transferStatus = "blocked";
    } else transferStatus = (await transferMarketplaceProviderFunds(bookingId)).status;
  } catch (transferError) {
    logMarketplaceCompletionFailure({ stage: "provider_payout_release", token, jobId, bookingId, error: transferError });
  }
  try { await notifyCompletionOutcome(bookingId, "confirmed", transferStatus); } catch (notificationError) { logMarketplaceCompletionFailure({ stage: "completion_notification", token, jobId, bookingId, error: notificationError }); }
  revalidatePath(`/jobs/${token}`);
  revalidatePath("/my-jobs");
  redirect(`/jobs/${token}`);
}

export async function reportMarketplaceCompletionIssue(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const bookingId = String(formData.get("bookingId") || "");
  const reasonCode = String(formData.get("reasonCode") || "customer_completion_issue").trim();
  const reasonText = String(formData.get("reasonText") || "").trim().slice(0, 2000);
  if (!bookingId || !reasonText) redirect(`/jobs/${token}?error=completion`);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("report_marketplace_completion_issue", { target_booking: bookingId, reason_code: reasonCode, reason_text: reasonText });
  if (error) redirect(`/jobs/${token}?error=completion`);
  try { await notifyCompletionOutcome(bookingId, "issue_reported"); } catch (notificationError) { console.error("marketplace_completion_email_failed", { bookingId, reason: notificationError instanceof Error ? notificationError.message.slice(0, 120) : "unknown" }); }
  revalidatePath(`/jobs/${token}`);
  redirect(`/jobs/${token}`);
}

export async function cancelMarketplaceBooking(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const bookingId = String(formData.get("bookingId") || "");
  const reasonCode = String(formData.get("reasonCode") || "customer_request").trim();
  const reasonText = String(formData.get("reasonText") || "").trim();
  if (!bookingId || !reasonCode || !reasonText) redirect(`/jobs/${token}?error=cancel`);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc("cancel_marketplace_booking", { target_booking: bookingId, reason_code: reasonCode, reason_text: reasonText });
  if (error) redirect(`/jobs/${token}?error=cancel`);
  const { data: cancelledBooking } = await createSupabaseAdminClient().from("marketplace_bookings").select("amount_pence,refunded_amount_pence,payment_status").eq("id", bookingId).maybeSingle();
  if (cancelledBooking?.payment_status === "refund_pending" && user) {
    try {
      const refund = await issueMarketplaceRefund(bookingId, Number(cancelledBooking.amount_pence || 0) - Number(cancelledBooking.refunded_amount_pence || 0), "Full refund after customer cancellation", user.id);
      if (refund.status === "failed") redirect(`/jobs/${token}?error=refund`);
    } catch (refundError) {
      console.error("marketplace_cancellation_refund_failed", { bookingId, reason: refundError instanceof Error ? refundError.message.slice(0, 160) : "unknown" });
      redirect(`/jobs/${token}?error=refund`);
    }
  }
  revalidatePath(`/jobs/${token}`); revalidatePath("/my-jobs");
  redirect(`/jobs/${token}`);
}

export async function submitMarketplaceReview(formData: FormData) {
  if (await getCurrentAccountRole() !== "customer") redirect("/");
  const token = String(formData.get("token") || "");
  const bookingId = String(formData.get("bookingId") || "");
  const rating = Number(formData.get("rating") || 0);
  const review = String(formData.get("review") || "").trim();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_marketplace_review", { target_booking: bookingId, review_rating: rating, review_body: review || null });
  if (error) redirect(`/jobs/${token}?error=review`);
  revalidatePath(`/jobs/${token}`);
  redirect(`/jobs/${token}`);
}
