import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe, getStripeWebhookSecret } from "@/lib/server/marketplace-payments";
import { finalizeMarketplacePayment } from "@/lib/server/marketplace-payment-finalization";
import { processDirectChargeWebhookEvent } from "@/lib/server/marketplace-direct-charge-webhooks";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  console.info("[marketplace-payment] webhook received", { hasSignature: Boolean(signature), bodyLength: body.length });
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error("[marketplace-payment] webhook verification failed", describeStripeError(error));
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  console.info("[marketplace-payment] webhook signature verified", { eventId: event.id, eventType: event.type, livemode: event.livemode });
  if (event.type === "application_fee.created") {
    const admin = createSupabaseAdminClient();
    await processDirectChargeWebhookEvent(admin, event);
    return NextResponse.json({ received: true });
  }
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid" || session.mode !== "payment") return NextResponse.json({ received: true });
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return NextResponse.json({ error: "missing_booking" }, { status: 400 });
  console.info("[marketplace-payment] checkout verified", { eventId: event.id, sessionId: session.id, bookingId, amountTotal: session.amount_total, currency: session.currency, paymentStatus: session.payment_status });

  const admin = createSupabaseAdminClient();
  const { data: eventClaim, error: eventClaimError } = await admin.rpc("claim_stripe_webhook_event", { target_event_id: event.id, target_event_type: event.type });
  if (eventClaimError) return NextResponse.json({ error: "webhook_ledger_failed" }, { status: 500 });
  if (["duplicate_processing", "duplicate_processed"].includes(eventClaim)) return NextResponse.json({ received: true });
  const { data: booking, error: bookingLookupError } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,conversation_id,amount_pence,currency,payment_flow,stripe_connected_account_id,payment_status,stripe_checkout_session_id,stripe_checkout_attempt_id,status,marketplace_jobs(public_token,status)").eq("id", bookingId).maybeSingle();
  if (bookingLookupError) {
    await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "booking_lookup_failed" }).eq("stripe_event_id", event.id);
    console.error("[marketplace-payment] booking lookup failed", { eventId: event.id, bookingId, code: bookingLookupError.code, reason: bookingLookupError.message });
    return NextResponse.json({ error: "booking_lookup_failed" }, { status: 500 });
  }
  if (!booking) { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "booking_not_found" }).eq("stripe_event_id", event.id); return NextResponse.json({ error: "booking_not_found" }, { status: 404 }); }
  const jobRelation = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  const sessionMismatch = booking.stripe_checkout_session_id && booking.stripe_checkout_session_id !== session.id;
  const attemptMismatch = booking.stripe_checkout_attempt_id && session.metadata?.checkout_attempt_id !== booking.stripe_checkout_attempt_id;
  if (booking.payment_flow === "direct_charge" || session.metadata?.payment_flow === "direct_charge" || (session.metadata?.payment_flow && session.metadata.payment_flow !== "platform_transfer") || sessionMismatch || attemptMismatch || booking.payment_status === "cancelled" || booking.status === "cancelled" || jobRelation?.status === "cancelled") { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: booking.payment_flow === "direct_charge" ? "wrong_webhook_context" : "stale_or_cancelled_session" }).eq("stripe_event_id", event.id); return NextResponse.json({ received: true }); }
  if (session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id) { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "metadata_mismatch" }).eq("stripe_event_id", event.id); return NextResponse.json({ error: "metadata_mismatch" }, { status: 400 }); }
  if (session.currency && session.currency !== booking.currency) { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "currency_mismatch" }).eq("stripe_event_id", event.id); return NextResponse.json({ error: "currency_mismatch" }, { status: 400 }); }
  if (session.amount_total !== Number(booking.amount_pence)) { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "amount_mismatch" }).eq("stripe_event_id", event.id); return NextResponse.json({ error: "amount_mismatch" }, { status: 400 }); }

  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,status").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) { await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "quote_not_accepted" }).eq("stripe_event_id", event.id); return NextResponse.json({ error: "quote_not_accepted" }, { status: 400 }); }
  try { await finalizeMarketplacePayment(admin, booking, session); } catch (error) {
    await admin.from("stripe_webhook_events").update({ status: "failed", error_message: "booking_update_failed" }).eq("stripe_event_id", event.id);
    console.error("[marketplace-payment] booking payment update failed", { eventId: event.id, bookingId, reason: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "booking_update_failed" }, { status: 500 });
  }
  console.info("[marketplace-payment] booking marked paid", { eventId: event.id, bookingId, quoteId: booking.quote_id, jobId: booking.job_id, amountPence: booking.amount_pence, currency: booking.currency });
  revalidatePath("/my-jobs");
  if (jobRelation?.public_token) revalidatePath(`/jobs/${jobRelation.public_token}`);
  if (booking.conversation_id) revalidatePath(`/messages/${booking.conversation_id}`);
  await admin.from("stripe_webhook_events").update({ status: "processed", processed_at: new Date().toISOString(), error_message: null }).eq("stripe_event_id", event.id);
  return NextResponse.json({ received: true });
}
