"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMarketplaceCustomerEmail } from "@/lib/server/marketplace-notifications";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getOrCreateMarketplaceConversation } from "@/lib/marketplace/conversations";
import { getStripe } from "@/lib/server/marketplace-payments";
import { createMarketplaceCheckout } from "@/app/jobs/payment-actions";

export async function submitMarketplaceOffer(formData: FormData) {
  const token = String(formData.get("token") || "");
  const amount = Math.round(Number(formData.get("amount") || 0) * 100);
  const message = String(formData.get("message") || "").trim();
  const availability = String(formData.get("availability") || "Flexible").trim();
  if (!token || !Number.isFinite(amount) || amount <= 0) redirect(`/jobs/${token}?error=offer`);
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) redirect("/pro/login?error=not-approved");
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id").eq("public_token", token).maybeSingle();
  if (!job) redirect(`/jobs/${token}?error=offer`);
  const { error } = await supabase.rpc("submit_marketplace_quote", { target_job: job.id, quote_amount: amount, quote_availability: "flexible", quote_availability_text: availability, quote_message: message || null });
  if (error) redirect(`/jobs/${token}?error=${/booked|locked|not_open/i.test(error.message) ? "locked" : "offer"}`);
  redirect(`/jobs/${token}?offered=1`);
}

export async function chooseMarketplaceQuote(formData: FormData) {
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  const returnTo = String(formData.get("returnTo") || "");
  if (!token || !quoteId) redirect("/");
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const { data: customer } = await admin.from("marketplace_customers").select("id,email").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  try {
    getStripe();
  } catch (error) {
    if (error instanceof Error && ["stripe_not_configured", "stripe_test_key_required"].includes(error.message)) redirect(`/jobs/${token}?error=stripe_config`);
    redirect(`/jobs/${token}?error=selection`);
  }
  // Keep the existing offer unchanged if the payment migration is still pending.
  const { error: paymentSchemaError } = await admin.from("marketplace_bookings").select("payment_status").limit(1);
  if (paymentSchemaError) {
    const missingPaymentSchema = paymentSchemaError.code === "42703" || /payment_status|schema cache|column .* does not exist/i.test(paymentSchemaError.message || "");
    redirect(`/jobs/${token}?error=${missingPaymentSchema ? "payment_setup" : "selection"}`);
  }
  const { error } = await supabase.rpc("accept_marketplace_offer", { target_quote: quoteId });
  if (error) redirect(returnTo.startsWith("/") ? `${returnTo}?error=selection` : `/jobs/${token}?error=selection`);
  if (customer.email) await sendMarketplaceCustomerEmail({ customerId: customer.id, jobId: job.id, eventType: "quote_selected", recipient: customer.email, idempotencyKey: `quote_selected:${quoteId}`, subject: "Your Quickola professional has been selected", html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>Professional selected</h1><p>Review the service price and booking details for your Quickola job.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://quickola.co.uk"}/jobs/${encodeURIComponent(token)}">Review your job</a></p></div>` });
  revalidatePath(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : `/jobs/${token}`);
  const checkoutData = new FormData();
  checkoutData.set("token", token);
  checkoutData.set("quoteId", quoteId);
  checkoutData.set("returnTo", returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : `/jobs/${token}`);
  return createMarketplaceCheckout(checkoutData);
}

export async function startCustomerConversation(formData: FormData) {
  const token = String(formData.get("token") || "");
  const providerId = String(formData.get("providerId") || "");
  if (!token || !providerId) redirect(`/jobs/${token}`);
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || customer.id !== job.customer_id) redirect(`/jobs/${token}?error=ownership`);
  let conversation;
  try {
    conversation = await getOrCreateMarketplaceConversation({ jobId: job.id, providerId, actorUserId: user.id, customerId: customer.id });
  } catch (error) {
    console.error("[startCustomerConversation] FAILED", { stage: "resolve-or-create-conversation", customerId: customer.id, jobId: job.id, code: error && typeof error === "object" && "code" in error ? error.code : undefined, message: error instanceof Error ? error.message : "unknown error", details: error && typeof error === "object" && "details" in error ? error.details : undefined, hint: error && typeof error === "object" && "hint" in error ? error.hint : undefined });
    redirect(`/jobs/${token}?error=message`);
  }
  redirect(`/messages/${conversation.id}`);
}
