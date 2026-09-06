import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { notifyBookingPaid } from "@/lib/marketplace/email/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/server/marketplace-payments";

type PaymentAdmin = ReturnType<typeof createSupabaseAdminClient>;

type PaymentBooking = {
  id: string;
  job_id: string;
  quote_id: string;
  provider_id?: string | null;
  conversation_id?: string | null;
  amount_pence: number;
  currency: string;
  payment_status?: string | null;
  payment_flow?: string | null;
  stripe_connected_account_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_application_fee_id?: string | null;
  refunded_amount_pence?: number | null;
  marketplace_jobs?: { public_token?: string | null } | { public_token?: string | null }[] | null;
};

async function ensureDirectChargePayoutAllocation(admin: PaymentAdmin, booking: PaymentBooking, chargeId: string | null) {
  if (booking.payment_flow !== "direct_charge" || !chargeId || !booking.stripe_connected_account_id || !booking.provider_id) throw new Error("direct_charge_payout_allocation_data_missing");
  const charge = await getStripe().charges.retrieve(chargeId, {}, { stripeAccount: booking.stripe_connected_account_id });
  const balanceTransactionId = typeof charge.balance_transaction === "string" ? charge.balance_transaction : charge.balance_transaction?.id;
  const balanceTransaction = balanceTransactionId ? await getStripe().balanceTransactions.retrieve(balanceTransactionId, {}, { stripeAccount: booking.stripe_connected_account_id }) : null;
  const stripeFee = balanceTransaction?.fee_details?.filter((item) => item.type === "stripe_fee").reduce((sum, item) => sum + Number(item.amount || 0), 0);
  if (stripeFee === undefined) throw new Error("direct_charge_payout_allocation_data_missing");
  const grossAmount = Number(booking.amount_pence || 0) - Number(booking.refunded_amount_pence || 0);
  const quickolaFee = Math.floor(grossAmount * 10 / 100);
  const providerNet = grossAmount - quickolaFee - stripeFee;
  if (providerNet <= 0) throw new Error("direct_charge_payout_allocation_invalid");
  const allocation = await admin.from("marketplace_payout_allocations").insert({ booking_id: booking.id, provider_id: booking.provider_id, stripe_connected_account_id: booking.stripe_connected_account_id, gross_amount_pence: grossAmount, quickola_fee_pence: quickolaFee, stripe_fee_pence: stripeFee, provider_net_pence: providerNet, payout_status: "pending" }).select("id").maybeSingle();
  if (allocation.error && allocation.error.code !== "23505") throw new Error("direct_charge_payout_allocation_failed");
}

export async function finalizeMarketplacePayment(admin: PaymentAdmin, booking: PaymentBooking, session: Stripe.Checkout.Session, eventAccountId?: string | null) {
  const directCharge = booking.payment_flow === "direct_charge";
  let chargeId = booking.stripe_charge_id || null;
  let applicationFeeId = booking.stripe_application_fee_id || null;
  if (directCharge) {
    if (!booking.stripe_connected_account_id || (eventAccountId && booking.stripe_connected_account_id !== eventAccountId)) throw new Error("direct_charge_account_mismatch");
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) throw new Error("direct_charge_payment_intent_missing");
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge", "latest_charge.balance_transaction", "latest_charge.application_fee"] }, { stripeAccount: booking.stripe_connected_account_id });
    if (paymentIntent.status !== "succeeded" || paymentIntent.amount !== Number(booking.amount_pence) || paymentIntent.currency !== booking.currency) throw new Error("direct_charge_payment_intent_invalid");
    const latestCharge = typeof paymentIntent.latest_charge === "string" ? null : paymentIntent.latest_charge;
    chargeId = latestCharge?.id || chargeId;
    const fee = latestCharge && typeof latestCharge.application_fee === "string" ? latestCharge.application_fee : latestCharge?.application_fee;
    applicationFeeId = typeof fee === "string" ? fee : fee?.id || applicationFeeId;
  }
  const { data: updatedBooking, error: updateError } = await admin.from("marketplace_bookings").update({
    payment_status: "paid",
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
    ...(directCharge ? { stripe_connected_account_id: booking.stripe_connected_account_id, stripe_charge_id: chargeId, stripe_application_fee_id: applicationFeeId } : {}),
    paid_at: new Date().toISOString(),
    status: "booked",
  }).eq("id", booking.id).eq("payment_flow", booking.payment_flow || "platform_transfer").or(`stripe_checkout_session_id.eq.${session.id},stripe_checkout_session_id.is.null`).eq("payment_status", "pending_payment").neq("status", "cancelled").select("id").maybeSingle();
  if (updateError || !updatedBooking) throw new Error("booking_update_failed");

  const { error: jobError } = await admin.from("marketplace_jobs").update({ status: "booked", updated_at: new Date().toISOString() }).eq("id", booking.job_id).in("status", ["awaiting_booking", "finding_provider", "posted"]);
  if (jobError) throw new Error("job_update_failed");

  if (directCharge) {
    await ensureDirectChargePayoutAllocation(admin, { ...booking, stripe_charge_id: chargeId }, chargeId);
  }

  try { await notifyBookingPaid(booking.id); } catch (error) { console.error("marketplace_booking_email_failed", { bookingId: booking.id, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" }); }
  const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  revalidatePath("/my-jobs");
  if (job?.public_token) revalidatePath(`/jobs/${job.public_token}`);
  if (booking.conversation_id) revalidatePath(`/messages/${booking.conversation_id}`);
}

export async function reconcileMarketplacePaymentOnReturn(admin: PaymentAdmin, bookingId: string) {
  const { getStripe } = await import("@/lib/server/marketplace-payments");
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,provider_id,conversation_id,amount_pence,currency,payment_status,payment_flow,stripe_connected_account_id,stripe_checkout_session_id,stripe_charge_id,stripe_application_fee_id,refunded_amount_pence,marketplace_jobs(public_token)").eq("id", bookingId).maybeSingle();
  if (error || !booking || !booking.stripe_checkout_session_id) return false;
  const session = await getStripe().checkout.sessions.retrieve(booking.stripe_checkout_session_id, undefined, booking.payment_flow === "direct_charge" && booking.stripe_connected_account_id ? { stripeAccount: booking.stripe_connected_account_id } : undefined);
  if (session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.booking_id !== booking.id || session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id || session.amount_total !== Number(booking.amount_pence) || (session.currency && session.currency !== booking.currency)) return false;
  const { data: quote } = await admin.from("marketplace_quotes").select("id,status,job_id").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) return false;
  if (booking.payment_status === "paid") {
    if (booking.payment_flow !== "direct_charge" || !booking.stripe_connected_account_id || !booking.stripe_charge_id) return false;
    await ensureDirectChargePayoutAllocation(admin, booking, booking.stripe_charge_id);
    return true;
  }
  await finalizeMarketplacePayment(admin, booking, session, booking.payment_flow === "direct_charge" ? booking.stripe_connected_account_id : null);
  return true;
}
