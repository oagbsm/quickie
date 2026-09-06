import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe } from "@/lib/server/marketplace-payments";
import { calculateProviderEarnings } from "@/lib/marketplace/provider-earnings";

export type MarketplaceTransferResult = { status: "paid" | "blocked" | "failed" | "already_processing"; transferId?: string };

function isDefinitiveTransferFailure(error: unknown) {
  const details = describeStripeError(error);
  if (["stripe_not_configured", "stripe_test_key_required"].includes(details.message)) return true;
  return details.statusCode !== undefined && details.statusCode >= 400 && details.statusCode < 500 && ![409, 429].includes(details.statusCode);
}

function safeTransferFailureCode(error: unknown) {
  const details = describeStripeError(error);
  if (details.message === "stripe_not_configured" || details.message === "stripe_test_key_required") return "stripe_configuration_failed";
  if (details.code === "balance_insufficient") return "stripe_balance_insufficient";
  return isDefinitiveTransferFailure(error) ? "stripe_transfer_rejected" : "stripe_transfer_indeterminate";
}

async function persistSuccessfulTransfer(admin: ReturnType<typeof createSupabaseAdminClient>, bookingId: string, transferId: string) {
  const persisted = await admin.from("marketplace_bookings").update({ provider_transfer_status: "paid", stripe_transfer_id: transferId, provider_transferred_at: new Date().toISOString(), provider_transfer_error: null, updated_at: new Date().toISOString() }).eq("id", bookingId).eq("provider_transfer_status", "processing").is("stripe_transfer_id", null).select("id").maybeSingle();
  return !persisted.error && Boolean(persisted.data);
}

function logSupabaseTransferLookupFailure(bookingId: string, stage: string, error: { code?: string; message?: string; details?: string; hint?: string }) {
  console.error("[marketplace-transfer] Supabase lookup failed", {
    bookingId,
    stage,
    supabaseCode: error.code || "unknown",
    message: (error.message || "unknown").slice(0, 200),
    details: (error.details || "").slice(0, 200),
    hint: (error.hint || "").slice(0, 200),
  });
}

/**
 * Transfer the persisted provider share after customer confirmation.
 * The database claim and Stripe idempotency key together make retries safe;
 * an ambiguous processing row is deliberately not automatically reclaimed.
 */
export async function transferMarketplaceProviderFunds(bookingId: string): Promise<MarketplaceTransferResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error: lookupError } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,provider_id,amount_pence,currency,payment_flow,payment_status,status,completion_status,provider_transfer_status,provider_transfer_amount_pence,provider_transfer_attempt,stripe_transfer_id,payout_hold_status,refunded_amount_pence,provider_transfer_error").eq("id", bookingId).maybeSingle();
  if (lookupError) {
    logSupabaseTransferLookupFailure(bookingId, "booking_lookup", lookupError);
    throw new Error("booking_transfer_lookup_failed");
  }
  if (!booking) throw new Error("booking_not_found");
  if (booking.payment_flow === "direct_charge") return { status: "blocked" };
  if (booking.provider_transfer_status === "paid" || booking.stripe_transfer_id) return { status: "paid", transferId: booking.stripe_transfer_id || undefined };
  if (booking.provider_transfer_status === "processing") return { status: "already_processing" };

  const { data: activeDispute, error: disputeError } = await admin.from("marketplace_disputes").select("id").eq("booking_id", booking.id).in("status", ["open", "in_review", "resolved_customer"]).maybeSingle();
  if (disputeError) throw new Error("booking_dispute_lookup_failed");
  const { data: pendingRefund, error: pendingRefundError } = await admin.from("marketplace_refunds").select("id").eq("booking_id", booking.id).eq("status", "pending").maybeSingle();
  if (pendingRefundError) throw new Error("booking_refund_lookup_failed");
  const earnings = calculateProviderEarnings(Number(booking.amount_pence || 0), Number(booking.refunded_amount_pence || 0));
  if (!(booking.payment_status === "paid" || booking.payment_status === "partially_refunded") || booking.completion_status !== "completed" || booking.status !== "completed" || booking.payout_hold_status === "held" || earnings.customerPaidPence <= 0 || activeDispute || pendingRefund) {
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "blocked", provider_transfer_error: "completion_or_payment_not_ready", updated_at: new Date().toISOString() }).eq("id", booking.id).in("provider_transfer_status", ["pending", "failed"]);
    return { status: "blocked" };
  }
  const providerAmountPence = earnings.providerEarningsPence;
  if (providerAmountPence <= 0) return { status: "blocked" };

  const currentAttempt = Number(booking.provider_transfer_attempt || 0);
  const nextAttempt = currentAttempt + 1;
  const { data: claimed, error: claimError } = await admin.from("marketplace_bookings").update({ provider_transfer_status: "processing", provider_transfer_amount_pence: providerAmountPence, provider_transfer_attempt: nextAttempt, provider_transfer_error: null, updated_at: new Date().toISOString() }).eq("id", booking.id).eq("provider_transfer_attempt", currentAttempt).in("provider_transfer_status", ["pending", "failed"]).neq("payout_hold_status", "held").select("id,provider_transfer_attempt").maybeSingle();
  if (claimError) throw new Error("booking_transfer_claim_failed");
  if (!claimed) {
    const { data: current } = await admin.from("marketplace_bookings").select("provider_transfer_status,stripe_transfer_id").eq("id", booking.id).maybeSingle();
    return current?.stripe_transfer_id || current?.provider_transfer_status === "paid" ? { status: "paid", transferId: current.stripe_transfer_id || undefined } : { status: "already_processing" };
  }

  const { data: provider } = await admin.from("marketplace_providers").select("user_id,stripe_account_id,stripe_status,marketplace_active").eq("user_id", booking.provider_id).maybeSingle();
  if (!provider?.stripe_account_id || provider.stripe_status !== "ready" || provider.marketplace_active === false) {
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "blocked", provider_transfer_error: "provider_stripe_not_ready", updated_at: new Date().toISOString() }).eq("id", booking.id);
    return { status: "blocked" };
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
    const existingTransfers = await stripe.transfers.list({ destination: provider.stripe_account_id, transfer_group: `marketplace_booking:${booking.id}`, limit: 10 });
    const existingTransfer = existingTransfers.data.find((transfer) => transfer.metadata?.booking_id === booking.id || transfer.transfer_group === `marketplace_booking:${booking.id}`);
    if (existingTransfer) {
      const persisted = await persistSuccessfulTransfer(admin, booking.id, existingTransfer.id);
      return persisted ? { status: "paid", transferId: existingTransfer.id } : { status: "already_processing", transferId: existingTransfer.id };
    }
  } catch (error) {
    console.error("[marketplace-transfer] existing transfer search failed", { bookingId, ...describeStripeError(error) });
    await admin.from("marketplace_bookings").update({ provider_transfer_status: "processing", provider_transfer_error: "stripe_transfer_lookup_indeterminate", updated_at: new Date().toISOString() }).eq("id", booking.id).eq("provider_transfer_status", "processing");
    return { status: "already_processing" };
  }

  try {
    const transfer = await stripe.transfers.create({ amount: providerAmountPence, currency: booking.currency || "gbp", destination: provider.stripe_account_id, transfer_group: `marketplace_booking:${booking.id}`, metadata: { booking_id: booking.id, job_id: booking.job_id, quote_id: booking.quote_id } }, { idempotencyKey: `marketplace-provider-transfer:${booking.id}:${nextAttempt}` });
    const persisted = await persistSuccessfulTransfer(admin, booking.id, transfer.id);
    if (!persisted) {
      console.error("[marketplace-transfer] Stripe transfer succeeded but booking state could not be persisted", { bookingId, transferId: transfer.id });
      return { status: "already_processing", transferId: transfer.id };
    }
    return { status: "paid", transferId: transfer.id };
  } catch (error) {
    const definitive = isDefinitiveTransferFailure(error);
    console.error("[marketplace-transfer] provider transfer failed", { bookingId, definitive, ...describeStripeError(error) });
    if (definitive) {
      await admin.from("marketplace_bookings").update({ provider_transfer_status: "failed", provider_transfer_error: safeTransferFailureCode(error), updated_at: new Date().toISOString() }).eq("id", booking.id).eq("provider_transfer_status", "processing");
    } else {
      await admin.from("marketplace_bookings").update({ provider_transfer_status: "processing", provider_transfer_error: "stripe_transfer_indeterminate", updated_at: new Date().toISOString() }).eq("id", booking.id).eq("provider_transfer_status", "processing");
    }
    return definitive ? { status: "failed" } : { status: "already_processing" };
  }
}

/**
 * Reconcile an ambiguous transfer claim without creating a second transfer.
 * A missing Stripe result is intentionally left processing: absence from a
 * list response is not proof that an in-flight request was rejected.
 */
export async function reconcileMarketplaceProviderTransfer(bookingId: string): Promise<MarketplaceTransferResult> {
  const admin = createSupabaseAdminClient();
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,provider_id,provider_transfer_status,stripe_transfer_id").eq("id", bookingId).maybeSingle();
  if (error) throw new Error("booking_transfer_lookup_failed");
  if (!booking) throw new Error("booking_not_found");
  if (booking.stripe_transfer_id || booking.provider_transfer_status === "paid") return { status: "paid", transferId: booking.stripe_transfer_id || undefined };
  if (booking.provider_transfer_status !== "processing") return { status: booking.provider_transfer_status === "blocked" ? "blocked" : "failed" };

  const { data: provider } = await admin.from("marketplace_providers").select("stripe_account_id").eq("user_id", booking.provider_id).maybeSingle();
  if (!provider?.stripe_account_id) return { status: "already_processing" };
  const transfers = await getStripe().transfers.list({ destination: provider.stripe_account_id, transfer_group: `marketplace_booking:${booking.id}`, limit: 10 });
  const matching = transfers.data.find((transfer) => transfer.metadata?.booking_id === booking.id || transfer.transfer_group === `marketplace_booking:${booking.id}`);
  if (!matching) return { status: "already_processing" };
  const persisted = await persistSuccessfulTransfer(admin, booking.id, matching.id);
  if (!persisted) return { status: "already_processing", transferId: matching.id };
  return { status: "paid", transferId: matching.id };
}
