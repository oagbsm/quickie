"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateMarketplacePlatformFeePence, describeStripeError, getStripe, getSiteUrl } from "@/lib/server/marketplace-payments";
import { getCurrentAccountRole } from "@/lib/auth/account-role";

export async function createMarketplaceCheckout(formData: FormData) {
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const requestedReturnTo = String(formData.get("returnTo") || `/jobs/${token}`);
  const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : `/jobs/${token}`;
  if (!token || !quoteId) redirect("/");
  if (await getCurrentAccountRole() !== "customer") redirect("/");

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

  const { data: existingBooking, error: bookingSchemaError } = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").eq("quote_id", quote.id).maybeSingle();
  if (bookingSchemaError) {
    console.error("[marketplace-payment] Booking lookup failed", { stage: "create-checkout", token, quoteId, userId: user.id, code: bookingSchemaError.code, reason: bookingSchemaError.message });
    redirect(`/jobs/${token}?error=payment_setup`);
  }
  const amountPence = Number(existingBooking?.amount_pence || quote.amount_pence);
  if (!Number.isInteger(amountPence) || amountPence <= 0) redirect(`/jobs/${token}?error=payment`);
  if (existingBooking?.payment_status === "paid") redirect(returnTo);

  const providerId = quote.provider_id || quote.bidder_user_id;
  const { data: conversation } = providerId
    ? await admin.from("marketplace_conversations").select("id").eq("job_id", job.id).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).maybeSingle()
    : { data: null };
  const platformFeePence = calculateMarketplacePlatformFeePence(amountPence);
  let booking = existingBooking;
  if (!booking) {
    const inserted = await admin.from("marketplace_bookings").insert({ job_id: job.id, quote_id: quote.id, customer_id: customer.id, provider_id: providerId, conversation_id: conversation?.id || null, amount_pence: amountPence, currency: "gbp", platform_fee_pence: platformFeePence, payment_status: "pending_payment", status: "awaiting_booking_fee" }).select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").single();
    if (inserted.error) {
      console.error("[marketplace-payment] Booking creation failed", { stage: "create-checkout", token, quoteId, userId: user.id, code: inserted.error.code, reason: inserted.error.message });
      const retry = await admin.from("marketplace_bookings").select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").eq("quote_id", quote.id).maybeSingle();
      if (retry.error || !retry.data) {
        console.error("[marketplace-payment] Existing booking retry failed", { stage: "create-checkout", token, quoteId, userId: user.id, code: retry.error?.code, reason: retry.error?.message || "booking_not_found" });
        redirect(`/jobs/${token}?error=payment`);
      }
      booking = retry.data;
    } else booking = inserted.data;
  } else if (!booking.conversation_id && conversation?.id) {
    const updated = await admin.from("marketplace_bookings").update({ conversation_id: conversation.id }).eq("id", booking.id).select("id,job_id,quote_id,customer_id,provider_id,conversation_id,amount_pence,currency,platform_fee_pence,payment_status,stripe_checkout_session_id").single();
    if (updated.error) console.error("[marketplace-payment] Booking conversation update failed", { stage: "create-checkout", token, quoteId, bookingId: booking.id, userId: user.id, code: updated.error.code, reason: updated.error.message });
    if (!updated.error && updated.data) booking = updated.data;
  }

  let checkoutUrl: string | null = null;
  let checkoutSessionId: string | null = null;
  let stripeStage = "configuration";
  try {
    const stripe = getStripe();
    if (booking.stripe_checkout_session_id) {
      stripeStage = "existing-session-retrieval";
      const existingSession = await stripe.checkout.sessions.retrieve(booking.stripe_checkout_session_id);
      if (existingSession.status === "open" && existingSession.url) checkoutUrl = existingSession.url;
      if (existingSession.status === "complete" || existingSession.payment_status === "paid") {
        redirect(`${returnTo}?payment=success`);
      }
    }
    if (!checkoutUrl) {
      stripeStage = "checkout-creation";
      const siteUrl = getSiteUrl();
      const successUrl = new URL(returnTo, `${siteUrl}/`);
      successUrl.searchParams.set("payment", "success");
      const cancelUrl = new URL(returnTo, `${siteUrl}/`);
      cancelUrl.searchParams.set("payment", "cancelled");
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price_data: { currency: "gbp", product_data: { name: "Quickola marketplace booking" }, unit_amount: amountPence }, quantity: 1 }],
        customer_email: customer.email || undefined,
        metadata: { booking_id: booking.id, job_id: job.id, quote_id: quote.id, conversation_id: conversation?.id || booking.conversation_id || "" },
        payment_intent_data: { transfer_group: `marketplace_booking:${booking.id}` },
        success_url: successUrl.toString(),
        cancel_url: cancelUrl.toString(),
      }, { idempotencyKey: `marketplace-booking:${booking.id}` });
      if (!session.url) throw new Error("stripe_checkout_url_missing");
      checkoutUrl = session.url;
      checkoutSessionId = session.id;
    }
  } catch (error) {
    const details = describeStripeError(error);
    const logLabel = stripeStage === "configuration" ? "Stripe configuration invalid" : stripeStage === "existing-session-retrieval" ? "Existing Stripe session retrieval failed" : "Stripe Checkout creation failed";
    console.error(`[marketplace-payment] ${logLabel}`, { stage: stripeStage, token, quoteId, bookingId: booking.id, userId: user.id, ...details });
    const reason = error instanceof Error ? error.message : "unknown";
    const setupFailure = ["stripe_not_configured", "stripe_test_key_required", "stripe_site_url_invalid", "stripe_webhook_not_configured"].includes(reason);
    redirect(`${returnTo}?error=${setupFailure ? "payment_setup" : "payment"}`);
  }
  if (!checkoutUrl) redirect(`${returnTo}?error=payment`);
  if (checkoutSessionId) {
    const { error: saved } = await admin.from("marketplace_bookings").update({ stripe_checkout_session_id: checkoutSessionId, amount_pence: amountPence, platform_fee_pence: platformFeePence }).eq("id", booking.id);
    if (saved) {
      console.error("[marketplace-payment] Booking update failed", { stage: "save-checkout-session", token, quoteId, bookingId: booking.id, userId: user.id, code: saved.code, reason: saved.message });
      redirect(`${returnTo}?error=payment`);
    }
  }
  redirect(checkoutUrl);
}
