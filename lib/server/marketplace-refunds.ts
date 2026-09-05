import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";

export type MarketplaceRefundResult = { status: "succeeded" | "failed" | "already_processing"; refundId?: string };

function safeDbError(error: unknown) {
  const value = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const text = (key: string) => typeof value[key] === "string" ? String(value[key]).slice(0, 240) : undefined;
  return { name: text("name"), type: text("type"), code: text("code"), statusCode: typeof value.statusCode === "number" ? value.statusCode : undefined, requestId: text("requestId"), message: text("message") || "unknown" };
}

function logRefund(input: { bookingId: string; stage: string; requestedRefundAmountPence?: number; alreadyRefundedAmountPence?: number; remainingRefundableAmountPence?: number; paymentStatus?: string | null; providerTransferStatus?: string | null; payoutHoldStatus?: string | null; reservation?: string; result?: string; stripeStage?: string; error?: unknown; resultingRefundStatus?: string | null }) {
  console.error("[marketplace-refund]", {
    bookingId: input.bookingId,
    requestedRefundAmountPence: input.requestedRefundAmountPence ?? null,
    alreadyRefundedAmountPence: input.alreadyRefundedAmountPence ?? null,
    remainingRefundableAmountPence: input.remainingRefundableAmountPence ?? null,
    paymentStatus: input.paymentStatus ?? null,
    providerTransferStatus: input.providerTransferStatus ?? null,
    payoutHoldStatus: input.payoutHoldStatus ?? null,
    refundReservation: input.reservation ?? null,
    result: input.result ?? null,
    stripeStage: input.stripeStage ?? null,
    error: input.error ? (input.error instanceof Error ? { name: input.error.name, message: input.error.message.slice(0, 240) } : safeDbError(input.error)) : null,
    resultingRefundStatus: input.resultingRefundStatus ?? null,
  });
}

export async function issueMarketplaceRefund(bookingId: string, amountPence: number, reason: string, adminUserId: string): Promise<MarketplaceRefundResult> {
  const admin = createSupabaseAdminClient();
  const bookingResult = await admin.from("marketplace_bookings").select("id,amount_pence,currency,payment_status,stripe_payment_intent_id,refunded_amount_pence,provider_transfer_status,payout_hold_status").eq("id", bookingId).maybeSingle();
  const booking = bookingResult.data;
  if (bookingResult.error) {
    logRefund({ bookingId, stage: "booking_lookup", requestedRefundAmountPence: amountPence, error: bookingResult.error });
    throw new Error("refund_booking_lookup_failed");
  }
  if (!booking || !["paid", "refund_pending", "partially_refunded"].includes(booking.payment_status) || !booking.stripe_payment_intent_id) {
    logRefund({ bookingId, stage: "eligibility_validation", requestedRefundAmountPence: amountPence, paymentStatus: booking?.payment_status, providerTransferStatus: booking?.provider_transfer_status, payoutHoldStatus: booking?.payout_hold_status, error: new Error("refund_not_eligible") });
    throw new Error("refund_not_eligible");
  }
  if (["processing", "paid"].includes(booking.provider_transfer_status || "")) {
    logRefund({ bookingId, stage: "post_transfer_guard", requestedRefundAmountPence: amountPence, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, error: new Error("refund_after_transfer_not_supported") });
    throw new Error("refund_after_transfer_not_supported");
  }
  const succeededRefundsResult = await admin.from("marketplace_refunds").select("amount_pence").eq("booking_id", bookingId).eq("status", "succeeded");
  if (succeededRefundsResult.error) {
    logRefund({ bookingId, stage: "refund_history_lookup", requestedRefundAmountPence: amountPence, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, error: succeededRefundsResult.error });
    throw new Error("refund_history_lookup_failed");
  }
  const succeededRefunds = succeededRefundsResult.data;
  const recordedRefunded = Math.max(Number(booking.refunded_amount_pence || 0), (succeededRefunds || []).reduce((sum, refund) => sum + Number(refund.amount_pence || 0), 0));
  const remaining = Number(booking.amount_pence || 0) - recordedRefunded;
  if (!Number.isSafeInteger(amountPence) || amountPence <= 0 || amountPence > remaining) {
    logRefund({ bookingId, stage: "amount_validation", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, error: new Error("refund_amount_invalid") });
    throw new Error("refund_amount_invalid");
  }
  const refundType = amountPence === Number(booking.amount_pence) ? "full" : "partial";
  const inserted = await admin.from("marketplace_refunds").insert({ booking_id: bookingId, stripe_payment_intent_id: booking.stripe_payment_intent_id, amount_pence: amountPence, currency: booking.currency || "gbp", refund_type: refundType, reason: reason.trim(), requested_by_admin_id: adminUserId }).select("id,stripe_refund_id,status").maybeSingle();
  if (inserted.error?.code === "23505") {
    logRefund({ bookingId, stage: "refund_reservation", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "already_processing", result: "already_processing", error: inserted.error });
    return { status: "already_processing" };
  }
  if (inserted.error || !inserted.data) {
    logRefund({ bookingId, stage: "refund_reservation", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "failed", error: inserted.error || new Error("refund_reservation_failed") });
    throw new Error("refund_reservation_failed");
  }
  logRefund({ bookingId, stage: "refund_reservation", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "created", result: "pending" });
  if (inserted.data.status === "succeeded") return { status: "succeeded", refundId: inserted.data.stripe_refund_id || undefined };
  try {
    logRefund({ bookingId, stage: "stripe_refund_create", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "created", stripeStage: "create" });
    const refund = await getStripe().refunds.create({ payment_intent: booking.stripe_payment_intent_id, amount: amountPence, reason: "requested_by_customer" }, { idempotencyKey: `marketplace-refund:${inserted.data.id}` });
    const persistedRefund = await admin.from("marketplace_refunds").update({ stripe_refund_id: refund.id, status: refund.status === "succeeded" ? "succeeded" : "pending", confirmed_at: refund.status === "succeeded" ? new Date().toISOString() : null }).eq("id", inserted.data.id).select("id").maybeSingle();
    if (persistedRefund.error || !persistedRefund.data) {
      logRefund({ bookingId, stage: "refund_record_persist", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "created", stripeStage: "succeeded", result: "already_processing", error: persistedRefund.error || new Error("refund_record_persist_failed"), resultingRefundStatus: refund.status });
      return { status: "already_processing", refundId: refund.id };
    }
    if (refund.status !== "succeeded") return { status: "already_processing", refundId: refund.id };
    const nextRefunded = recordedRefunded + amountPence;
    const persistedBooking = await admin.from("marketplace_bookings").update({ refunded_amount_pence: nextRefunded, payment_status: nextRefunded >= Number(booking.amount_pence) ? "refunded" : "partially_refunded", payout_hold_status: "held", payout_hold_reason: "customer_refund", payout_hold_at: new Date().toISOString(), provider_transfer_status: "blocked", provider_transfer_error: "customer_refund_pending", updated_at: new Date().toISOString() }).eq("id", bookingId).eq("refunded_amount_pence", Number(booking.refunded_amount_pence || 0)).select("id").maybeSingle();
    if (persistedBooking.error || !persistedBooking.data) {
      logRefund({ bookingId, stage: "booking_state_persist", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "created", stripeStage: "succeeded", result: "already_processing", error: persistedBooking.error || new Error("booking_state_persist_failed"), resultingRefundStatus: refund.status });
      return { status: "already_processing", refundId: refund.id };
    }
    return { status: "succeeded", refundId: refund.id };
  } catch (error) {
    const stripeError = describeStripeError(error);
    const errorType = stripeError.type || "";
    const indeterminate = !stripeError.statusCode || ["StripeConnectionError", "StripeAPIError", "StripeRateLimitError"].includes(errorType);
    if (!indeterminate) await admin.from("marketplace_refunds").update({ status: "failed", failure_reason: stripeError.message }).eq("id", inserted.data.id).eq("status", "pending");
    logRefund({ bookingId, stage: "stripe_refund_create", requestedRefundAmountPence: amountPence, alreadyRefundedAmountPence: recordedRefunded, remainingRefundableAmountPence: remaining, paymentStatus: booking.payment_status, providerTransferStatus: booking.provider_transfer_status, payoutHoldStatus: booking.payout_hold_status, reservation: "created", stripeStage: indeterminate ? "indeterminate" : "definitive_failure", result: indeterminate ? "already_processing" : "failed", error: { name: stripeError.type || stripeError.name, message: stripeError.message, code: stripeError.code }, resultingRefundStatus: indeterminate ? "pending" : "failed" });
    return { status: indeterminate ? "already_processing" : "failed" };
  }
}
