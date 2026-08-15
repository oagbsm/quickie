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
  const { data: offers } = await admin.from("marketplace_quotes").select("id,job_id,amount_pence,status,created_at,marketplace_jobs(service,service_subtype,postcode)").eq("provider_id", provider.providerId).order("created_at", { ascending: false });
  const jobIds = (offers || []).map((offer) => offer.job_id);
  const { data: conversations } = jobIds.length ? await admin.from("marketplace_conversations").select("id,job_id,provider_id").in("job_id", jobIds).eq("provider_id", provider.providerId) : { data: [] };
  const conversationByJob = new Map((conversations || []).map((conversation) => [conversation.job_id, conversation.id]));
  const statusLabel = (status: string) => ({ pending: "Pending", submitted: "Pending", accepted: "Accepted", selected: "Accepted", declined: "Declined", withdrawn: "Withdrawn", expired: "Expired" }[status] || status);
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><h1 className="text-4xl font-black">My offers</h1><p className="mt-2 text-[#657089]">Track the prices you have sent to customers.</p><div className="mt-7 grid gap-4">{offers?.map((offer) => { const job = offer.marketplace_jobs as { service?: string; service_subtype?: string; postcode?: string } | null; const accepted = ["accepted", "selected"].includes(offer.status); const conversation = conversationByJob.get(offer.job_id); return <article key={offer.id} className={`rounded-3xl border bg-white p-6 ${accepted ? "border-[#23a955] ring-2 ring-[#23a955]/15" : "border-[#e7ebef]"}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#159548]">{job?.service || "Marketplace job"}</p><h2 className="mt-2 text-xl font-black capitalize">{(job?.service_subtype || job?.service || "Job").replaceAll("-", " ")}</h2><p className="mt-2 text-sm text-[#657089]">{job?.postcode || "Approximate location"}</p></div><span className={`rounded-full px-3 py-1 text-sm font-black ${accepted ? "bg-[#eef8f1] text-[#167d3c]" : "bg-[#f1f3f6] text-[#657089]"}`}>{statusLabel(offer.status)}</span></div><div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm"><span className="font-black">Price offered · £{Math.round(offer.amount_pence / 100)}</span><span className="text-[#657089]">Sent {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(offer.created_at))}</span></div><div className="mt-5 flex flex-wrap gap-3"><Link href={`/work/jobs/${offer.job_id}`} className="min-h-10 rounded-xl bg-[#061b3f] px-4 py-2 text-sm font-black text-white">View job</Link>{accepted && conversation && <Link href={`/messages/${conversation}`} className="min-h-10 rounded-xl border border-[#dbe1ea] px-4 py-2 text-sm font-black">Message customer</Link>}</div></article>; })}{!offers?.length && <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-8 text-center text-[#657089]"><p>You haven’t sent any offers yet.</p><Link href="/work" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Browse jobs</Link></div>}</div></section></main>;
}
