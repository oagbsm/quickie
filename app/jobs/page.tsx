import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MarketplaceBrowseClient from "./MarketplaceBrowseClient";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOperationalMarketplaceProvider } from "@/lib/marketplace/provider-access";

export default async function JobsPage() {
  const provider = await getOperationalMarketplaceProvider();
  if (!provider) redirect("/my-jobs");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,optional_note,requested_timing,budget_amount,map_latitude,map_longitude,status,created_at,marketplace_quotes(count)").in("status", ["posted", "finding_provider"]).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(`marketplace_provider_jobs_failed:${error.code}`);
  const jobs = (data || []).map((job) => ({ ...job, offer_count: Array.isArray(job.marketplace_quotes) ? Number(job.marketplace_quotes[0]?.count || 0) : 0 }));
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8"><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">PROVIDER MARKETPLACE</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Find jobs near you</h1><p className="mt-2 text-[#657089]">Browse open jobs and send customers your price.</p><MarketplaceBrowseClient jobs={jobs} /></section></main>;
}
