import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { formatMarketplaceAmount, getCustomerJobState, getCustomerJobStatusLabel } from "@/lib/marketplace/customer-job-state";

const ACTIVE_OFFER_STATUSES = ["pending", "submitted", "selected", "accepted"];

export default async function MyJobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-jobs");
  if (await getApprovedMarketplaceProvider()) redirect("/work");
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  let { data: posted, error: postedError } = customer
    ? await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,budget_amount,status,created_at,marketplace_quotes(id,amount_pence,status),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at)").eq("customer_id", customer.id).order("created_at", { ascending: false })
    : { data: [], error: null };
  if (customer && postedError?.code === "42703" && /budget_amount/i.test(postedError.message)) {
    const fallback = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,status,created_at,marketplace_quotes(id,amount_pence,status),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at)").eq("customer_id", customer.id).order("created_at", { ascending: false });
    posted = fallback.data?.map((job) => ({ ...job, budget_amount: null })) ?? null;
    postedError = fallback.error;
  }
  const jobIds = (posted || []).map((job) => job.id);
  const { data: conversations } = jobIds.length ? await admin.from("marketplace_conversations").select("id,job_id").in("job_id", jobIds) : { data: [] };
  const conversationIdsByJob = new Map<string, string[]>();
  for (const conversation of conversations || []) {
    const ids = conversationIdsByJob.get(conversation.job_id) || [];
    ids.push(conversation.id);
    conversationIdsByJob.set(conversation.job_id, ids);
  }
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-black text-[#159548]">MY JOBS</p><h1 className="mt-2 text-4xl font-black">My jobs</h1></div><Link href="/#job-composer" className="rounded-xl bg-[#23a955] px-5 py-3 font-black text-[#061b3f]">Post a job</Link></div><div className="mt-6 grid gap-4">{posted?.map((job) => { const quotes = Array.isArray(job.marketplace_quotes) ? job.marketplace_quotes : []; const activeQuotes = quotes.filter((quote) => ACTIVE_OFFER_STATUSES.includes(quote.status)); const acceptedQuote = activeQuotes.find((quote) => ["accepted", "selected"].includes(quote.status)); const bookings = Array.isArray(job.marketplace_bookings) ? job.marketplace_bookings : []; const booking = acceptedQuote ? bookings.find((item) => item.quote_id === acceptedQuote.id) : null; const state = getCustomerJobState({ offerCount: activeQuotes.length, acceptedQuote, booking }); const statusLabel = getCustomerJobStatusLabel(state); const conversationIds = conversationIdsByJob.get(job.id) || []; const activityHref = conversationIds.length === 1 ? `/messages/${conversationIds[0]}` : `/jobs/${job.public_token}`; const jobHref = `/jobs/${job.public_token}`; const title = (job.service_subtype || job.service).replaceAll("-", " "); const amount = acceptedQuote?.amount_pence ?? booking?.amount_pence; const budget = job.budget_amount == null ? "Open budget" : formatMarketplaceAmount(Number(job.budget_amount) * 100); const isBooked = state === "booked"; return <article key={job.id} className="rounded-3xl border border-[#e7ebef] bg-white p-6"><Link href={jobHref} className="block"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black capitalize">{title}</h2><p className="mt-2 text-sm text-[#657089]">{job.postcode}</p></div><span className={`rounded-full px-3 py-1 text-sm font-black ${isBooked ? "bg-[#dff4e4] text-[#167d3c]" : state === "payment_required" || state === "payment_processing" ? "bg-[#fff8e8] text-[#8a5a00]" : "bg-[#eef8f1] text-[#167d3c]"}`}>{statusLabel}</span></div>{acceptedQuote ? <div className={`mt-4 rounded-2xl p-4 ${isBooked ? "bg-[#eef8f1]" : "bg-[#f5fbf6]"}`}><p className="font-black text-[#167d3c]">{isBooked ? "✓ Booked" : "✓ Offer accepted"}</p><p className="mt-2 text-sm font-bold text-[#526078]">Agreed price</p><p className="text-2xl font-black">{formatMarketplaceAmount(amount)}</p>{state === "payment_required" && <><p className="mt-2 font-black text-[#8a5a00]">Payment required</p><p className="mt-1 text-sm text-[#526078]">Complete payment to confirm your booking.</p></>}{state === "payment_processing" && <p className="mt-2 font-black text-[#8a5a00]">Payment processing</p>}{isBooked && <p className="mt-2 font-black text-[#167d3c]">✓ Paid · Your provider is booked.</p>}</div> : <><p className="mt-3 font-black text-[#167d3c]">Budget · {budget}</p><p className="mt-2 text-sm font-bold text-[#526078]">{activeQuotes.length} {activeQuotes.length === 1 ? "offer" : "offers"} received</p></>}</Link><div className="mt-4 flex flex-wrap items-center gap-3">{state === "payment_required" && acceptedQuote && <Link href={jobHref} className="rounded-xl bg-[#23a955] px-4 py-3 font-black text-[#061b3f]">Book &amp; pay {formatMarketplaceAmount(amount)}</Link>}{isBooked && conversationIds.length === 1 && <Link href={activityHref} className="font-black text-[#167d3c]">Message provider →</Link>}{!acceptedQuote && activeQuotes.length > 0 && <Link href={jobHref} className="font-black text-[#167d3c]">Review {activeQuotes.length === 1 ? "offer" : "offers"} →</Link>}{!acceptedQuote && activeQuotes.length === 0 && <span className="font-black text-[#657089]">Waiting for offers →</span>}{state === "payment_processing" && <Link href={jobHref} className="font-black text-[#167d3c]">View booking →</Link>}{acceptedQuote && !isBooked && state !== "payment_processing" && <Link href={activityHref} className="font-black text-[#167d3c]">View activity →</Link>}</div></article>; })}{!posted?.length && <Empty text="You haven’t posted a job yet." />}</div></section></main>;
}

function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-10 text-center text-[#657089]">{text}<Link href="/#job-composer" className="mt-3 block font-black text-[#167d3c]">Post a job →</Link></div>; }
