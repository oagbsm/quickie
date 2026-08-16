"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, getSiteUrl, MARKETPLACE_PLATFORM_FEE_PERCENT } from "@/lib/server/marketplace-payments";

export async function createMarketplaceCheckout(formData: FormData) {
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const requestedReturnTo = String(formData.get("returnTo") || `/jobs/${token}`);
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : `/jobs/${token}`;
  if (!token || !quoteId) redirect("/");

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);

  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id,email").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,public_token,customer_id,status").eq("public_token", token).maybeSingle();
  const { data: quote } = await admin.from("marketplace_quotes").select("id,job_id,provider_id,bidder_user_id,amount_pence,status").eq("id", quoteId).maybeSingle();
  if (!customer || !job || job.customer_id !== customer.id || !quote || quote.job_id !== job.id || !["accepted", "selected"].includes(quote.status)) {
    redirect(`/jobs/${token}?error=payment`);
  }

  const { data: existingBooking } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").eq("quote_id", quote.id).maybeSingle();
  const amountPence = Number(existingBooking?.amount_pence || quote.amount_pence);
  if (!Number.isInteger(amountPence) || amountPence <= 0) redirect(`/jobs/${token}?error=payment`);
  if (existingBooking?.payment_status === "paid") redirect(returnTo);

  const providerId = quote.provider_id || quote.bidder_user_id;
  const { data: conversation } = providerId
    ? await admin.from("marketplace_conversations").select("id").eq("job_id", job.id).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).maybeSingle()
    : { data: null };
  const platformFeePence = Math.round(amountPence * MARKETPLACE_PLATFORM_FEE_PERCENT / 100);
  let booking = existingBooking;
  if (!booking) {
    const inserted = await admin.from("marketplace_bookings").insert({ job_id: job.id, quote_id: quote.id, customer_id: customer.id, provider_id: providerId, conversation_id: conversation?.id || null, amount_pence: amountPence, currency: "gbp", platform_fee_pence: platformFeePence, payment_status: "pending_payment", status: "awaiting_booking_fee" }).select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").single();
    if (inserted.error) {
      const retry = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").eq("quote_id", quote.id).maybeSingle();
      if (retry.error || !retry.data) redirect(`/jobs/${token}?error=payment`);
      booking = retry.data;
    } else booking = inserted.data;
  } else if (!booking.conversation_id && conversation?.id) {
    const updated = await admin.from("marketplace_bookings").update({ conversation_id: conversation.id }).eq("id", booking.id).select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").single();
    if (!updated.error && updated.data) booking = updated.data;
  }

  const stripe = getStripe();
  if (booking.stripe_checkout_session_id) {
    const existingSession = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
    if (existingSession.status === "open" && existingSession.url) redirect(existingSession.url);
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "gbp", product_data: { name: "Quickola marketplace booking" }, unit_amount: amountPence }, quantity: 1 }],
    customer_email: customer.email || undefined,
    metadata: { booking_id: booking.id, job_id: job.id, quote_id: quote.id, conversation_id: conversation?.id || booking.conversation_id || "" },
    success_url: `${getSiteUrl()}${returnTo}?payment=success`,
    cancel_url: `${getSiteUrl()}${returnTo}?payment=cancelled`,
  }, { idempotencyKey: `marketplace-booking:${booking.id}` });
  const { error: saved } = await admin.from("marketplace_bookings").update({ stripe_checkout_session_id: session.id, amount_pence: amountPence, platform_fee_pence: platformFeePence }).eq("id", booking.id);
  if (saved) redirect(`${returnTo}?error=payment`);
  if (!session.url) redirect(`${returnTo}?error=payment`);
  redirect(session.url);
}
