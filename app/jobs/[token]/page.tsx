import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { getJob, getService } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { chooseMarketplaceQuote } from "@/app/jobs/actions";

export const metadata: Metadata = { title: "Quickola job", robots: { index: false, follow: false } };

export default async function JobPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createSupabaseAdminClient();
  let { data, error } = await admin.from("marketplace_jobs").select("id,customer_id,service,service_subtype,pricing_answers,postcode,requested_timing,optional_note,budget_amount,status,created_at").eq("public_token", token).maybeSingle();
  if (error?.code === "42703" && /budget_amount/i.test(error.message)) {
    const fallback = await admin.from("marketplace_jobs").select("id,customer_id,service,service_subtype,pricing_answers,postcode,requested_timing,optional_note,status,created_at").eq("public_token", token).maybeSingle();
    data = fallback.data ? { ...fallback.data, budget_amount: null } : null;
    error = fallback.error;
  }
  if (error || !data) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data : null;
  const isOwner = Boolean(customer && customer.id === data.customer_id);
  const service = getService(data.service);
  const selectedJob = getJob(data.service, data.service_subtype);
  const { data: quotes } = await admin.from("marketplace_quotes").select("id,amount_pence,availability_type,availability_text,message,status,provider_id,bidder_user_id,cleaner_profiles(display_name,business_name)").eq("job_id", data.id).in("status", ["pending", "submitted", "selected", "accepted"]).order("created_at", { ascending: true });
  const price = data.budget_amount == null ? "Open budget" : `£${Number(data.budget_amount).toFixed(2).replace(/\.00$/, "")}`;
  const title = selectedJob?.name || service?.name || data.service;
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-16"><div className="rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-9"><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">{isOwner ? "Your job" : "Local job"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em]">{title}</h1><p className="mt-4 text-sm text-[#526078]">📍 {data.postcode} · {data.requested_timing || "Flexible timing"}</p>{data.optional_note && <p className="mt-6 whitespace-pre-wrap leading-7 text-[#39465b]">{data.optional_note}</p>}<div className="mt-7 grid gap-3 sm:grid-cols-3"><Detail label="Budget" value={price} /><Detail label="Offers" value={`${quotes?.length || 0}`} /><Detail label="Status" value={data.status.replaceAll("_", " ")} /></div>{isOwner && <section className="mt-8 border-t border-[#e9edf1] pt-7"><h2 className="text-2xl font-black">Offers received</h2>{quotes?.length ? <div className="mt-4 grid gap-3">{quotes.map((quote) => <article key={quote.id} className="rounded-2xl bg-[#f7f8fa] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{(quote.cleaner_profiles as { business_name?: string | null; display_name?: string | null } | null)?.business_name || (quote.cleaner_profiles as { display_name?: string | null } | null)?.display_name || "Local person"}</p><p className="mt-1 text-sm text-[#526078]">{quote.availability_text || "Flexible"} · {quote.status}</p></div><p className="text-2xl font-black">£{Math.round(quote.amount_pence / 100)}</p></div>{quote.message && <p className="mt-3 text-sm leading-6 text-[#526078]">{quote.message}</p>}{["pending", "submitted"].includes(quote.status) && <form action={chooseMarketplaceQuote} className="mt-4"><input type="hidden" name="token" value={token} /><input type="hidden" name="quoteId" value={quote.id} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 text-sm font-black text-white">Accept offer</button></form>}</article>)}</div> : <p className="mt-3 text-[#657089]">No offers yet. We’ll show them here as people respond.</p>}</section>}</div></section></main>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f7f8fa] p-4"><p className="text-xs font-black uppercase tracking-[.1em] text-[#707b8d]">{label}</p><p className="mt-2 font-black capitalize">{value}</p></div>; }
