import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MarketplaceBrowseClient from "./MarketplaceBrowseClient";

export default async function JobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/jobs");
  const admin = createSupabaseAdminClient();
  const browseFilters = { status: ["posted", "finding_provider"] } as const;
  let { data: jobs, error: browseError } = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,optional_note,requested_timing,map_latitude,map_longitude,created_at,marketplace_quotes(count)").in("status", browseFilters.status).order("created_at", { ascending: false }).limit(80);
  if (browseError?.code === "42703" && /map_(latitude|longitude)/i.test(browseError.message)) {
    const fallback = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,optional_note,requested_timing,created_at,marketplace_quotes(count)").in("status", browseFilters.status).order("created_at", { ascending: false }).limit(80);
    browseError = fallback.error;
    jobs = fallback.data?.map((job) => ({ ...job, map_latitude: null, map_longitude: null })) ?? null;
  }
  if (browseError) console.error("marketplace_browse_failed", { code: browseError.code, message: browseError.message });
  const shaped = (jobs || []).map((job) => ({ ...job, offer_count: Array.isArray(job.marketplace_quotes) ? Number(job.marketplace_quotes[0]?.count || 0) : 0 }));
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-[1480px] px-4 py-7 sm:px-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">QUICKOLA MARKETPLACE</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em]">Find local jobs near you</h1><p className="mt-2 text-[#657089]">People nearby are looking for help.</p></div><Link href="/#job-composer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#23a955] px-6 font-black text-[#061b3f]">Post a job</Link></div><MarketplaceBrowseClient jobs={shaped} /></section></main>;
}
