import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { getJob, getService } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { chooseMarketplaceQuote, startCustomerConversation, submitMarketplaceOffer } from "@/app/jobs/actions";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";

export const metadata: Metadata = { title: "Quickola job", robots: { index: false, follow: false } };

export default async function JobPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ offered?: string; error?: string }> }) {
  const { token } = await params;
  const { offered, error: offerError } = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("marketplace_jobs").select("id,customer_id,service,service_subtype,pricing_answers,postcode,requested_timing,optional_note,budget_amount,status,created_at").eq("public_token", token).maybeSingle();
  if (error || !data) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data : null;
  const isOwner = Boolean(customer && customer.id === data.customer_id);
  const provider = user && !isOwner ? await getApprovedMarketplaceProvider() : null;
  const service = getService(data.service);
  const selectedJob = getJob(data.service, data.service_subtype);
  const { data: quotes } = await admin.from("marketplace_quotes").select("id,amount_pence,availability_text,message,status,provider_id,bidder_user_id,cleaner_profiles(display_name,business_name)").eq("job_id", data.id).in("status", ["pending", "submitted", "selected", "accepted"]).order("created_at", { ascending: true });
  const { data: conversations } = isOwner ? await admin.from("marketplace_conversations").select("id,provider_id,bidder_user_id").eq("job_id", data.id) : { data: [] };
  const conversationByProvider = new Map((conversations || []).map((item) => [item.provider_id || item.bidder_user_id, item.id]));
  const price = data.budget_amount == null ? "Open budget" : `£${Number(data.budget_amount).toFixed(2).replace(/\.00$/, "")}`;
  const title = selectedJob?.name || service?.name || data.service;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16"><div className="rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">{isOwner ? "Your job" : "Local job"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em]">{title}</h1><p className="mt-4 text-sm text-[#526078]">📍 {data.postcode} · {data.requested_timing || "Flexible timing"}</p>{data.optional_note && <p className="mt-6 whitespace-pre-wrap leading-7 text-[#39465b]">{data.optional_note}</p>}<div className="mt-7 grid gap-3 sm:grid-cols-3"><Detail label="Budget" value={price} /><Detail label="Offers" value={`${quotes?.length || 0}`} /><Detail label="Status" value={data.status.replaceAll("_", " ")} /></div>{!isOwner && provider && <section className="mt-8 border-t border-[#e9edf1] pt-7"><h2 className="text-2xl font-black">Send your offer</h2>{offered ? <p className="mt-3 rounded-xl bg-[#eaf8ee] p-4 font-bold text-[#167d3c]">Your offer has been sent.</p> : <form action={submitMarketplaceOffer} className="mt-4 grid gap-4"><label className="font-bold">Your price (£)<input name="amount" type="number" min="1" step="0.01" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="font-bold">Availability<input name="availability" placeholder="e.g. This week" className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><input type="hidden" name="token" value={token} />{offerError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">We couldn’t send your offer. Please try again.</p>}<button className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">Send offer</button></form>}</section>}{isOwner && <section className="mt-8 border-t border-[#e9edf1] pt-7"><h2 className="text-2xl font-black">Offers received</h2>{quotes?.length ? <div className="mt-4 grid gap-3">{quotes.map((quote) => { const profile = Array.isArray(quote.cleaner_profiles) ? quote.cleaner_profiles[0] : quote.cleaner_profiles; const providerId = quote.provider_id || quote.bidder_user_id; const conversationId = conversationByProvider.get(providerId); return <article key={quote.id} className="rounded-2xl bg-[#f7f8fa] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{profile?.business_name || profile?.display_name || "Local person"}</p><p className="mt-1 text-sm text-[#526078]">{quote.availability_text || "Flexible"} · {quote.status}</p></div><p className="text-2xl font-black">£{Math.round(quote.amount_pence / 100)}</p></div><div className="mt-4 flex flex-wrap gap-3">{conversationId ? <Link href={`/messages/${conversationId}`} className="min-h-11 rounded-xl border border-[#dbe1ea] px-4 py-2 text-sm font-black">Message provider</Link> : <form action={startCustomerConversation}><input type="hidden" name="token" value={token} /><input type="hidden" name="providerId" value={providerId || ""} /><button className="min-h-11 rounded-xl border border-[#dbe1ea] px-4 py-2 text-sm font-black">Message provider</button></form>}{["pending", "submitted"].includes(quote.status) && <form action={chooseMarketplaceQuote} className="inline-flex"><input type="hidden" name="token" value={token} /><input type="hidden" name="quoteId" value={quote.id} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 text-sm font-black text-white">Accept offer</button></form>}</div></article>; })}</div> : <p className="mt-3 text-[#657089]">No offers yet. We’ll show them here as people respond.</p>}</section>}</div></section></main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f7f8fa] p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#707b8d]">{label}</p><p className="mt-2 font-black capitalize">{value}</p></div>; }
