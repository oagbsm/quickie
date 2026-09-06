import "server-only";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { finalizeMarketplacePayment } from "@/lib/server/marketplace-payment-finalization";

type Admin = ReturnType<typeof createSupabaseAdminClient>;
type DirectEventObject = { id?: string; metadata?: Record<string, string>; payment_intent?: string | { id?: string } | null; originating_transaction?: string | null; payment_status?: string; mode?: string; amount_total?: number | null; currency?: string | null; status?: string };

async function claim(admin: Admin, event: Stripe.Event) {
  const { data, error } = await admin.rpc("claim_stripe_webhook_event", { target_event_id: event.id, target_event_type: event.type });
  if (error) throw new Error("webhook_ledger_failed");
  return data === "claimed";
}

async function mark(admin: Admin, event: Stripe.Event, status: "processed" | "failed", errorMessage: string | null = null) {
  await admin.from("stripe_webhook_events").update({ status, error_message: errorMessage, ...(status === "processed" ? { processed_at: new Date().toISOString() } : {}) }).eq("stripe_event_id", event.id);
}

async function findBooking(admin: Admin, accountId: string, input: { bookingId?: string | null; paymentIntentId?: string | null; chargeId?: string | null }) {
  if (input.bookingId) {
    const { data } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,payment_flow,stripe_connected_account_id,stripe_checkout_session_id,stripe_checkout_attempt_id,stripe_payment_intent_id,stripe_charge_id,stripe_application_fee_id,payment_status,status,marketplace_jobs(public_token,status)").eq("id", input.bookingId).maybeSingle();
    if (data) return data;
  }
  if (input.paymentIntentId) {
    const { data } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,payment_flow,stripe_connected_account_id,stripe_checkout_session_id,stripe_checkout_attempt_id,stripe_payment_intent_id,stripe_charge_id,stripe_application_fee_id,payment_status,status,marketplace_jobs(public_token,status)").eq("stripe_payment_intent_id", input.paymentIntentId).eq("stripe_connected_account_id", accountId).maybeSingle();
    if (data) return data;
  }
  if (input.chargeId) {
    const { data } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,payment_flow,stripe_connected_account_id,stripe_checkout_session_id,stripe_checkout_attempt_id,stripe_payment_intent_id,stripe_charge_id,stripe_application_fee_id,payment_status,status,marketplace_jobs(public_token,status)").eq("stripe_charge_id", input.chargeId).eq("stripe_connected_account_id", accountId).maybeSingle();
    if (data) return data;
  }
  return null;
}

function payoutStatusForEvent(eventType: string, stripeStatus?: string) {
  if (eventType === "payout.paid" || stripeStatus === "paid") return "paid" as const;
  if (eventType === "payout.failed" || eventType === "payout.canceled" || stripeStatus === "failed" || stripeStatus === "canceled") return "failed" as const;
  if (["payout.created", "payout.updated"].includes(eventType) && ["pending", "in_transit"].includes(stripeStatus || "")) return "processing" as const;
  return null;
}

async function reconcilePayoutEvent(admin: Admin, event: Stripe.Event, accountId: string) {
  const object = event.data.object as unknown as DirectEventObject;
  const payoutId = object.id;
  if (!payoutId) throw new Error("payout_id_missing");
  const allocationId = object.metadata?.payout_allocation_id;
  const query = admin.from("marketplace_payout_allocations").select("id,booking_id,stripe_connected_account_id,payout_status").eq("stripe_payout_id", payoutId).maybeSingle();
  let allocation = (await query).data;
  if (!allocation && allocationId) {
    allocation = (await admin.from("marketplace_payout_allocations").select("id,booking_id,stripe_connected_account_id,payout_status").eq("id", allocationId).maybeSingle()).data;
  }
  if (!allocation || allocation.stripe_connected_account_id !== accountId) throw new Error("payout_allocation_not_found");
  const nextStatus = payoutStatusForEvent(event.type, object.status);
  if (!nextStatus || allocation.payout_status === "paid" || (allocation.payout_status === "failed" && nextStatus === "processing")) return;
  const { error } = await admin.from("marketplace_payout_allocations").update({
    payout_status: nextStatus,
    stripe_payout_id: payoutId,
    paid_out_at: nextStatus === "paid" ? new Date().toISOString() : null,
    failure_reason: nextStatus === "failed" ? `stripe_payout_${object.status || event.type.replace("payout.", "")}` : null,
    updated_at: new Date().toISOString(),
  }).eq("id", allocation.id).neq("payout_status", "paid");
  if (error) throw new Error("payout_reconciliation_failed");
}

export async function processDirectChargeWebhookEvent(admin: Admin, event: Stripe.Event) {
  const accountId = event.account;
  if (!accountId && event.type !== "application_fee.created") return false;
  if (!await claim(admin, event)) return true;
  try {
    const object = event.data.object as unknown as DirectEventObject;
    const metadata = object.metadata || {};
    if (["payout.created", "payout.updated", "payout.paid", "payout.failed", "payout.canceled"].includes(event.type)) {
      if (!accountId) throw new Error("payout_account_missing");
      await reconcilePayoutEvent(admin, event, accountId);
      await mark(admin, event, "processed");
      return true;
    }
    const booking = await findBooking(admin, accountId || "", {
      bookingId: metadata.booking_id,
      paymentIntentId: typeof object.payment_intent === "string" ? object.payment_intent : object.payment_intent?.id,
      chargeId: typeof object.id === "string" && object.id.startsWith("ch_") ? object.id : typeof object.originating_transaction === "string" ? object.originating_transaction : null,
    });

  if (event.type === "checkout.session.completed") {
    if (booking?.payment_status === "paid" && booking.stripe_checkout_session_id === object.id) {
      await mark(admin, event, "processed");
      return true;
    }
    if (!booking || booking.payment_flow !== "direct_charge" || booking.stripe_connected_account_id !== accountId || metadata.payment_flow !== "direct_charge" || metadata.job_id !== booking.job_id || metadata.quote_id !== booking.quote_id || metadata.checkout_attempt_id !== booking.stripe_checkout_attempt_id || booking.payment_status === "cancelled" || booking.status === "cancelled" || object.payment_status !== "paid" || object.mode !== "payment" || object.amount_total !== Number(booking.amount_pence) || (object.currency && object.currency !== booking.currency)) {
      await mark(admin, event, "failed", "direct_charge_validation_failed");
      return true;
    }
    const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,status").eq("id", booking.quote_id).maybeSingle();
    if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) {
      await mark(admin, event, "failed", "quote_not_accepted");
      return true;
    }
    try {
      await finalizeMarketplacePayment(admin, booking, object as Stripe.Checkout.Session, accountId);
      await mark(admin, event, "processed");
    } catch (error) {
      await mark(admin, event, "failed", error instanceof Error ? error.message : "direct_charge_finalization_failed");
    }
    return true;
  }

  if (event.type === "application_fee.created") {
    const fee = object as unknown as Stripe.ApplicationFee;
    if (booking && booking.payment_flow === "direct_charge" && (!accountId || booking.stripe_connected_account_id === accountId)) {
      await admin.from("marketplace_bookings").update({ stripe_application_fee_id: fee.id }).eq("id", booking.id).eq("payment_flow", "direct_charge");
    } else if (!booking && typeof fee.originating_transaction === "string") {
      await admin.from("marketplace_bookings").update({ stripe_application_fee_id: fee.id }).eq("stripe_charge_id", fee.originating_transaction).eq("payment_flow", "direct_charge");
    }
    await mark(admin, event, "processed");
    return true;
  }

  if (event.type === "charge.refunded") {
    const charge = object as unknown as Stripe.Charge;
    if (!booking || booking.payment_flow !== "direct_charge" || booking.stripe_connected_account_id !== accountId) {
      await mark(admin, event, "failed", "direct_charge_booking_not_found");
      return true;
    }
    const refunded = Math.min(Number(booking.amount_pence), Number(charge.amount_refunded || 0));
    await admin.from("marketplace_bookings").update({ refunded_amount_pence: refunded, payment_status: refunded >= Number(booking.amount_pence) ? "refunded" : "partially_refunded", payout_hold_status: "held", payout_hold_reason: "customer_refund", payout_hold_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", booking.id).eq("payment_flow", "direct_charge");
    await mark(admin, event, "processed");
    return true;
  }

  if (event.type === "charge.dispute.created") {
    const dispute = object as unknown as Stripe.Dispute;
    if (!booking || booking.payment_flow !== "direct_charge" || booking.stripe_connected_account_id !== accountId) {
      await mark(admin, event, "failed", "direct_charge_booking_not_found");
      return true;
    }
    const { data: provider } = await admin.from("marketplace_providers").select("user_id").eq("stripe_account_id", accountId).maybeSingle();
    if (provider?.user_id) {
      const { data: existingDispute } = await admin.from("marketplace_disputes").select("id").eq("booking_id", booking.id).in("status", ["open", "in_review"]).maybeSingle();
      if (!existingDispute) await admin.from("marketplace_disputes").insert({ booking_id: booking.id, opened_by_user_id: provider.user_id, opened_by_type: "provider", reason_code: "stripe_chargeback", description: `Stripe dispute ${dispute.id} was created for this direct charge.`, status: "open" });
    }
    await admin.from("marketplace_bookings").update({ payout_hold_status: "held", payout_hold_reason: "stripe_dispute", payout_hold_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", booking.id).eq("payment_flow", "direct_charge");
    await mark(admin, event, "processed");
    return true;
  }

    await mark(admin, event, "processed");
    return true;
  } catch (error) {
    const reason = error instanceof Error && /^[a-z0-9_]+$/.test(error.message) ? error.message : "direct_charge_processing_failed";
    await mark(admin, event, "failed", reason.slice(0, 120));
    throw error;
  }
}
