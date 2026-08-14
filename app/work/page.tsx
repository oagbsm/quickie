import Link from "next/link";
import { redirect } from "next/navigation";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { getApprovedMarketplaceProvider, getSignedInUser } from "@/lib/marketplace/provider-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function WorkPage() {
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) {
    const user = await getSignedInUser();
    redirect(user ? "/pro/login?error=not-approved" : "/pro/login");
  }
  const supabase = await createSupabaseServerClient();
  const { data: matches } = await supabase.rpc("get_marketplace_opportunities");
  const admin = createSupabaseAdminClient();
  const ids = (matches || []).map((job: { id: string }) => job.id);
  const { data: jobs } = ids.length ? await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,budget_amount,requested_timing,created_at,status").in("id", ids).order("created_at", { ascending: false }) : { data: [] };
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-5xl px-5 py-10 sm:px-8"><p className="text-sm font-black text-[#159548]">PRIVATE PROVIDER WORK</p><h1 className="mt-2 text-4xl font-black">Jobs near you</h1><p className="mt-2 text-[#657089]">Send your price for jobs you’d like to do.</p><div className="mt-8 grid gap-4 sm:grid-cols-2">{jobs?.map((job) => <Link key={job.id} href={`/work/jobs/${job.id}`} className="rounded-3xl border border-[#e7ebef] bg-white p-6"><p className="text-xs font-black uppercase tracking-[.12em] text-[#159548]">{job.service}</p><h2 className="mt-2 text-xl font-black capitalize">{(job.service_subtype || job.service).replaceAll("-", " ")}</h2><p className="mt-3 text-sm text-[#657089]">{job.postcode} · {job.requested_timing || "Flexible timing"}</p><p className="mt-4 font-black text-[#167d3c]">{job.budget_amount == null ? "Open budget" : `Budget: £${Number(job.budget_amount).toFixed(2).replace(/\.00$/, "")}`}</p><span className="mt-5 inline-block font-black text-[#167d3c]">View job →</span></Link>)}{!jobs?.length && <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-8 text-[#657089]">No suitable open jobs right now.</div>}</div></section></main>;
}
