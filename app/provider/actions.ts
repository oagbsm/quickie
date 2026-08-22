"use server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOperationalMarketplaceProvider } from "@/lib/marketplace/provider-access";

export async function submitProviderOffer(formData: FormData) {
  const jobId = String(formData.get("jobId") || ""); const amount = Number(formData.get("amount") || 0); const message = String(formData.get("message") || "").trim();
  if (!jobId || !Number.isFinite(amount) || amount <= 0) redirect(`/provider/jobs/${jobId}?error=validation`);
  const provider = await getOperationalMarketplaceProvider();
  if (!provider) redirect("/pro/login?error=not-approved");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("submit_marketplace_quote", { target_job: jobId, quote_amount: Math.round(amount * 100), quote_availability: "flexible", quote_availability_text: "Flexible", quote_message: message || null });
  if (error) redirect(`/work/jobs/${jobId}?error=offer`);
  redirect(`/work/jobs/${jobId}?sent=1`);
}
