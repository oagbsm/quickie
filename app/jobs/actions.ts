"use server";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendMarketplaceCustomerEmail } from "@/lib/server/marketplace-notifications";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";

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
  if (error) redirect(`/jobs/${token}?error=offer`);
  redirect(`/jobs/${token}?offered=1`);
}

export async function chooseMarketplaceQuote(formData: FormData) {
  const token = String(formData.get("token") || "");
  const quoteId = String(formData.get("quoteId") || "");
  if (!token || !quoteId) redirect("/");
  const admin = createSupabaseAdminClient();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/jobs/${token}`)}`);
  const { data: customer } = await admin.from("marketplace_customers").select("id,email").eq("auth_user_id", user.id).maybeSingle();
  const { data: job } = await admin.from("marketplace_jobs").select("id,customer_id").eq("public_token", token).maybeSingle();
  if (!customer || !job || job.customer_id !== customer.id) redirect(`/jobs/${token}?error=ownership`);
  const { error } = await admin.rpc("select_marketplace_quote", { target_token: token, target_quote: quoteId });
  if (error) redirect(`/jobs/${token}?error=selection`);
  if (customer.email) await sendMarketplaceCustomerEmail({ customerId: customer.id, jobId: job.id, eventType: "quote_selected", recipient: customer.email, idempotencyKey: `quote_selected:${quoteId}`, subject: "Your Quickola professional has been selected", html: `<div style="font-family:Arial,sans-serif;color:#071638"><h1>Professional selected</h1><p>Review the service price and booking details for your Quickola job.</p><p><a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://quickola.co.uk"}/jobs/${encodeURIComponent(token)}">Review your job</a></p></div>` });
  const { data: conversation } = await admin.from("marketplace_conversations").select("id").eq("job_id", job.id).maybeSingle();
  if (conversation?.id) redirect(`/messages/${conversation.id}`);
  redirect(`/jobs/${token}`);
}
