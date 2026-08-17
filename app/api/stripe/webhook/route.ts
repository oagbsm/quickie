import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { describeStripeError, getStripe, getStripeWebhookSecret } from "@/lib/server/marketplace-payments";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getStripeWebhookSecret());
  } catch (error) {
    console.error("[marketplace-payment] Webhook signature verification failed", describeStripeError(error));
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid" || session.mode !== "payment") return NextResponse.json({ received: true });
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return NextResponse.json({ error: "missing_booking" }, { status: 400 });

  const admin = createSupabaseAdminClient();
  const { data: booking } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,amount_pence,currency,payment_status").eq("id", bookingId).maybeSingle();
  if (!booking) return NextResponse.json({ error: "booking_not_found" }, { status: 404 });
  if (session.metadata?.job_id !== booking.job_id || session.metadata?.quote_id !== booking.quote_id) return NextResponse.json({ error: "metadata_mismatch" }, { status: 400 });
  if (session.currency && session.currency !== booking.currency) return NextResponse.json({ error: "currency_mismatch" }, { status: 400 });
  if (session.amount_total !== Number(booking.amount_pence)) return NextResponse.json({ error: "amount_mismatch" }, { status: 400 });

  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,status").eq("id", booking.quote_id).maybeSingle();
  if (!quote || quote.job_id !== booking.job_id || !["accepted", "selected"].includes(quote.status)) return NextResponse.json({ error: "quote_not_accepted" }, { status: 400 });
  const { error: updateError } = await admin.from("marketplace_bookings").update({ payment_status: "paid", stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null, paid_at: new Date().toISOString(), status: "booked" }).eq("id", booking.id).neq("payment_status", "paid");
  if (updateError) return NextResponse.json({ error: "booking_update_failed" }, { status: 500 });
  const { error: jobError } = await admin.from("marketplace_jobs").update({ status: "booked", updated_at: new Date().toISOString() }).eq("id", booking.job_id).in("status", ["awaiting_booking", "finding_provider", "posted"]);
  if (jobError) return NextResponse.json({ error: "job_update_failed" }, { status: 500 });
  return NextResponse.json({ received: true });
}
