import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import ProviderHeader from "@/app/components/marketplace/ProviderHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApprovedMarketplaceProvider, getSignedInUser } from "@/lib/marketplace/provider-access";
import { submitWorkOffer } from "@/app/work/actions";

export default async function WorkJobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; sent?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) {
    const user = await getSignedInUser();
    redirect(user ? "/pro/login?error=not-approved" : "/pro/login");
  }
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  const { data: job } = await admin.from("marketplace_jobs").select("id,service,service_subtype,postcode,approximate_area,pricing_answers,requested_timing,optional_note,budget_amount,status,created_at").eq("id", id).maybeSingle();
  if (!job) notFound();
  const { data: ownOffer } = await admin.from("marketplace_quotes").select("id,status,amount_pence").eq("job_id", id).eq("provider_id", provider.providerId).maybeSingle();
  if (!ownOffer && ["posted", "finding_provider"].includes(job.status)) {
    const { data: matches } = await supabase.rpc("get_marketplace_opportunities");
    if (!(matches || []).some((match: { id: string }) => match.id === id)) notFound();
  } else if (!ownOffer) notFound();
  const { data: photos } = await admin.from("marketplace_job_photos").select("id,storage_path").eq("job_id", id).order("created_at", { ascending: true });
  const signed = photos?.length ? await admin.storage.from("marketplace-job-photos").createSignedUrls(photos.map((photo) => photo.storage_path), 600) : { data: [] };
  const title = (job.service_subtype || job.service).replaceAll("-", " ");
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><ProviderHeader /><section className="mx-auto max-w-2xl px-5 py-10 sm:px-8"><Link href="/work" className="text-sm font-black text-[#167d3c]">← Jobs near you</Link><div className="mt-5 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">{job.service}</p><h1 className="mt-2 text-3xl font-black capitalize">{title}</h1><p className="mt-3 text-sm text-[#657089]">{job.approximate_area || job.postcode} · {job.requested_timing || "Flexible timing"}</p><p className="mt-2 text-xs text-[#8390a1]">Posted {new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(job.created_at))}</p>{job.optional_note && <p className="mt-6 whitespace-pre-wrap leading-7 text-[#39465b]">{job.optional_note}</p>}{signed.data?.length ? <section className="mt-6"><h2 className="text-lg font-black">Photos</h2><div className="mt-3 grid grid-cols-2 gap-3">{signed.data.map((photo, index) => photo?.signedUrl ? <a key={photos?.[index]?.id || photo.signedUrl} href={photo.signedUrl} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border"><Image src={photo.signedUrl} alt="Customer job photo" width={600} height={600} unoptimized className="aspect-square w-full object-cover" /></a> : null)}</div></section> : null}<div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#707b8d]">Customer budget</p><p className="mt-2 font-black">{job.budget_amount == null ? "Open budget" : `£${Number(job.budget_amount).toFixed(2).replace(/\.00$/, "")}`}</p></div>{ownOffer ? <p className="mt-6 rounded-2xl bg-[#eef8f1] p-4 font-black text-[#167d3c]">Your offer is {ownOffer.status === "selected" || ownOffer.status === "accepted" ? "accepted" : "already sent"}. Track it in My offers.</p> : <form action={submitWorkOffer} className="mt-7 grid gap-4"><input type="hidden" name="jobId" value={job.id} /><h2 className="text-xl font-black">Send your price</h2><label className="font-bold">Your price (£)<input name="amount" type="number" min="1" step="1" required className="mt-2 min-h-12 w-full rounded-xl border border-[#dbe1ea] px-4" /></label><label className="font-bold">Optional message<textarea name="message" rows={4} className="mt-2 w-full rounded-xl border border-[#dbe1ea] px-4 py-3" placeholder="I can help with this job." /></label>{query.error && <p className="text-sm font-bold text-red-700">We couldn’t send that offer. Please try again.</p>}<button className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">Send offer</button></form>}</div></section></main>;
}
