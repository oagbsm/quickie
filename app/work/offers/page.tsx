import Link from "next/link";
import { redirect } from "next/navigation";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApprovedMarketplaceProvider, getSignedInUser } from "@/lib/marketplace/provider-access";

export default async function WorkOffersPage() {
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) {
    const user = await getSignedInUser();
    redirect(user ? "/pro/login?error=not-approved" : "/pro/login");
  }
  const admin = createSupabaseAdminClient();
  const { data: offers } = await admin.from("marketplace_quotes").select("id,job_id,amount_pence,status,marketplace_jobs(service,service_subtype,postcode)").eq("provider_id", provider.providerId).order("created_at", { ascending: false });
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-black">My offers</h1><div className="mt-7 grid gap-4">{offers?.map((offer) => { const job = offer.marketplace_jobs as { service?: string; service_subtype?: string; postcode?: string } | null; const status = offer.status === "selected" ? "Accepted" : offer.status === "submitted" ? "Pending" : offer.status.charAt(0).toUpperCase() + offer.status.slice(1); return <Link key={offer.id} href={`/work/jobs/${offer.job_id}`} className="rounded-3xl border border-[#e7ebef] bg-white p-6"><h2 className="text-xl font-black capitalize">{(job?.service_subtype || job?.service || "Job").replaceAll("-", " ")}</h2><p className="mt-2 text-sm text-[#657089]">{job?.postcode || "Approximate location"}</p><p className="mt-4 font-black">My price · £{Math.round(offer.amount_pence / 100)}</p><p className="mt-2 font-black text-[#167d3c]">{status}</p></Link>; })}{!offers?.length && <p className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-8 text-[#657089]">You haven’t sent any offers yet.</p>}</div></section></main>;
}
