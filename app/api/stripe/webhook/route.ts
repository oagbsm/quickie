import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe, getStripeWebhookSecret } from "@/lib/server/marketplace-payments";
import { syncProviderStripeStatus } from "@/lib/server/provider-stripe";

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
  if (event.type === "account.updated" && event.account) {
    try {
      await syncProviderStripeStatus(event.account, event.data.object as Stripe.Account);
      revalidatePath("/work");
      revalidatePath("/work/onboarding");
      revalidatePath("/admin/providers");
    } catch (error) {
      console.error("[provider-stripe] account.updated handling failed", { eventId: event.id, accountId: event.account, reason: error instanceof Error ? error.message : "unknown" });
      return NextResponse.json({ error: "provider_status_update_failed" }, { status: 500 });
    }
    return NextResponse.json({ received: true });
  }
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid" || session.mode !== "payment") return NextResponse.json({ received: true });
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return NextResponse.json({ error: "missing_booking" }, { status: 400 });
  console.info("[marketplace-payment] checkout verified", { eventId: event.id, sessionId: session.id, bookingId, amountTotal: session.amount_total, currency: session.currency, paymentStatus: session.payment_status });

  const admin = createSupabaseAdminClient();
  const { data: booking, error: bookingLookupError } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,conversation_id,amount_pence,currency,payment_status,marketplace_jobs(public_token)").eq("id", bookingId).maybeSingle();
  if (bookingLookupError) {
    console.error("[marketplace-payment] booking lookup failed", { eventId: event.id, bookingId, code: bookingLookupError.code, reason: bookingLookupError.message });
    return NextResponse.json({ error: "booking_lookup_failed" }, { status: 500 });
  }
  if (!booking) return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  if (session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id) return NextResponse.json({ error: "metadata_mismatch" }, { status: 400 });
  if (session.currency && session.currency !== booking.currency) return NextResponse.json({ error: "currency_mismatch" }, { status: 400 });
  if (session.amount_total !== Number(booking.amount_pence)) return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });

  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,status").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) return NextResponse.json({ error: "quote_not_accepted" }, { status: 400 });
  const { error: updateError } = await admin.from("marketplace_bookings").update({ payment_status: "paid", stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null, paid_at: new Date().toISOString(), status: "booked" }).eq("id", booking.id).neq("payment_status", "paid");
  if (updateError) {
    console.error("[marketplace-payment] booking payment update failed", { eventId: event.id, bookingId, code: updateError.code, reason: updateError.message });
    return NextResponse.json({ error: "booking_update_failed" }, { status: 500 });
  }
  const { error: jobError } = await admin.from("marketplace_jobs").update({ status: "booked", updated_at: new Date().toISOString() }).eq("id", booking.job_id).in("status", ["awaiting_booking", "finding_provider", "posted"]);
  if (jobError) {
    console.error("[marketplace-payment] job update failed", { eventId: event.id, bookingId, jobId: booking.job_id, code: jobError.code, reason: jobError.message });
    return NextResponse.json({ error: "job_update_failed" }, { status: 500 });
  }
  console.info("[marketplace-payment] booking marked paid", { eventId: event.id, bookingId, quoteId: booking.quote_id, jobId: booking.job_id, amountPence: booking.amount_pence, currency: booking.currency });
  const jobRelation = Array.isArray(booking.marketplace_jobs) ? booking.marketplace_jobs[0] : booking.marketplace_jobs;
  revalidatePath("/my-jobs");
  if (jobRelation?.public_token) revalidatePath(`/jobs/${jobRelation.public_token}`);
  if (booking.conversation_id) revalidatePath(`/messages/${booking.conversation_id}`);
  return NextResponse.json({ received: true });
}
