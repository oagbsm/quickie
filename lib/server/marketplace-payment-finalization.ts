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
  conversation_id?: string | null;
  amount_pence: number;
  currency: string;
  payment_status?: string | null;
  payment_flow?: string | null;
  stripe_connected_account_id?: string | null;
  stripe_charge_id?: string | null;
  stripe_application_fee_id?: string | null;
  marketplace_jobs?: { public_token?: string | null } | { public_token?: string | null }[] | null;
};

export async function finalizeMarketplacePayment(admin: PaymentAdmin, booking: PaymentBooking, session: Stripe.Checkout.Session, eventAccountId?: string | null) {
  const directCharge = booking.payment_flow === "direct_charge";
  let chargeId = booking.stripe_charge_id || null;
  let applicationFeeId = booking.stripe_application_fee_id || null;
  if (directCharge) {
    if (!booking.stripe_connected_account_id || (eventAccountId && booking.stripe_connected_account_id !== eventAccountId)) throw new Error("direct_charge_account_mismatch");
    const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntentId) throw new Error("direct_charge_payment_intent_missing");
    const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge"] }, { stripeAccount: booking.stripe_connected_account_id });
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

  try { await notifyBookingPaid(booking.id); } catch (error) { console.error("marketplace_booking_email_failed", { bookingId: booking.id, reason: error instanceof Error ? error.message.slice(0, 120) : "unknown" }); }
  const job = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  revalidatePath("/my-jobs");
  if (job?.public_token) revalidatePath(`/jobs/${job.public_token}`);
  if (booking.conversation_id) revalidatePath(`/messages/${booking.conversation_id}`);
}

export async function reconcileMarketplacePaymentOnReturn(admin: PaymentAdmin, bookingId: string) {
  const { getStripe } = await import("@/lib/server/marketplace-payments");
  const { data: booking, error } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,conversation_id,amount_pence,currency,payment_status,payment_flow,stripe_connected_account_id,stripe_checkout_session_id,stripe_charge_id,stripe_application_fee_id,marketplace_jobs(public_token)").eq("id", bookingId).maybeSingle();
  if (error || !booking || booking.payment_status === "paid" || !booking.stripe_checkout_session_id) return false;
  const session = await getStripe().checkout.sessions.retrieve(booking.stripe_checkout_session_id, undefined, booking.payment_flow === "direct_charge" && booking.stripe_connected_account_id ? { stripeAccount: booking.stripe_connected_account_id } : undefined);
  if (session.mode !== "payment" || session.payment_status !== "paid" || session.metadata?.booking_id !== booking.id || session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id || session.amount_total !== Number(booking.amount_pence) || (session.currency && session.currency !== booking.currency)) return false;
  const { data: quote } = await admin.from("marketplace_quotes").select("id,status,job_id").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) return false;
  await finalizeMarketplacePayment(admin, booking, session, booking.payment_flow === "direct_charge" ? booking.stripe_connected_account_id : null);
  return true;
}
