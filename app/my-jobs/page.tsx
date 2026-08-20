import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MobileBottomNav from "@/app/components/marketplace/MobileBottomNav";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { formatMarketplaceAmount, getCustomerJobState, getCustomerJobStatusLabel, normalizeMarketplaceRelation } from "@/lib/marketplace/customer-job-state";

const ACTIVE_OFFER_STATUSES = ["pending", "submitted", "selected", "accepted"];
type Quote = { id: string; amount_pence: number; status: string };
type Booking = { quote_id: string; amount_pence: number; payment_status?: string | null; stripe_checkout_session_id?: string | null };
type JobView = { job: { id: string; public_token: string | null; service: string; service_subtype: string | null; postcode: string; budget_amount: number | null }; activeQuotes: Quote[]; acceptedQuote?: Quote; booking?: Booking; state: string; statusLabel: string; conversationIds: string[]; jobHref: string; title: string; amount?: number; budget: string };

export default async function MyJobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-jobs");
  if (await getApprovedMarketplaceProvider()) redirect("/work");
  const admin = createSupabaseAdminClient();
  const { data: customer } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  let { data: posted, error: postedError } = customer ? await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,budget_amount,status,created_at,marketplace_quotes(id,amount_pence,status),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at)").eq("customer_id", customer.id).order("created_at", { ascending: false }) : { data: [], error: null };
  if (customer && postedError?.code === "42703" && /budget_amount/i.test(postedError.message)) {
    const fallback = await admin.from("marketplace_jobs").select("id,public_token,service,service_subtype,postcode,status,created_at,marketplace_quotes(id,amount_pence,status),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at)").eq("customer_id", customer.id).order("created_at", { ascending: false });
    posted = fallback.data?.map((job) => ({ ...job, budget_amount: null })) ?? null;
    postedError = fallback.error;
  }
  const jobIds = (posted || []).map((job) => job.id);
  const { data: conversations } = jobIds.length ? await admin.from("marketplace_conversations").select("id,job_id").in("job_id", jobIds) : { data: [] };
  const conversationIdsByJob = new Map<string, string[]>();
  for (const conversation of conversations || []) conversationIdsByJob.set(conversation.job_id, [...(conversationIdsByJob.get(conversation.job_id) || []), conversation.id]);
  const jobs = (posted || []).map((job) => {
    const quotes = Array.isArray(job.marketplace_quotes) ? job.marketplace_quotes : [];
    const activeQuotes = quotes.filter((quote) => ACTIVE_OFFER_STATUSES.includes(quote.status));
    const acceptedQuote = activeQuotes.find((quote) => ["accepted", "selected"].includes(quote.status));
    const bookings = normalizeMarketplaceRelation(job.marketplace_bookings);
    const booking = acceptedQuote ? bookings.find((item) => item.quote_id === acceptedQuote.id) : undefined;
    const state = getCustomerJobState({ offerCount: activeQuotes.length, acceptedQuote, booking });
    return { job, activeQuotes, acceptedQuote, booking, state, statusLabel: getCustomerJobStatusLabel(state), conversationIds: conversationIdsByJob.get(job.id) || [], jobHref: `/jobs/${job.public_token}`, title: (job.service_subtype || job.service).replaceAll("-", " "), amount: acceptedQuote?.amount_pence ?? booking?.amount_pence, budget: job.budget_amount == null ? "Open budget" : formatMarketplaceAmount(Number(job.budget_amount) * 100) } as JobView;
  });
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><div className="hidden md:block"><DesktopMyJobs jobs={jobs} /></div><div className="md:hidden"><MobileMyJobs jobs={jobs} /></div></main>;
}

function DesktopMyJobs({ jobs }: { jobs: JobView[] }) { return <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-black text-[#159548]">MY JOBS</p><h1 className="mt-2 text-4xl font-black">My jobs</h1></div><Link href="/#job-composer" className="rounded-xl bg-[#23a955] px-5 py-3 font-black text-[#061b3f]">Post a job</Link></div><div className="mt-6 grid gap-4">{jobs.map((item) => <DesktopJobCard key={item.job.id} item={item} />)}{!jobs.length && <Empty text="You haven’t posted a job yet." />}</div></section>; }

function DesktopJobCard({ item }: { item: JobView }) { const { job, activeQuotes, acceptedQuote, state, statusLabel, conversationIds, jobHref, title, amount, budget } = item; const isBooked = state === "booked"; const activityHref = conversationIds.length === 1 ? `/messages/${conversationIds[0]}` : jobHref; return <article className="rounded-3xl border border-[#e7ebef] bg-white p-6"><Link href={jobHref} className="block"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black capitalize">{title}</h2><p className="mt-2 text-sm text-[#657089]">{job.postcode}</p></div><span className={`rounded-full px-3 py-1 text-sm font-black ${isBooked ? "bg-[#dff4e4] text-[#167d3c]" : state === "payment_required" || state === "payment_processing" ? "bg-[#fff8e8] text-[#8a5a00]" : "bg-[#eef8f1] text-[#167d3c]"}`}>{statusLabel}</span></div>{acceptedQuote ? <div className={`mt-4 rounded-2xl p-4 ${isBooked ? "bg-[#eef8f1]" : "bg-[#f5fbf6]"}`}><p className="font-black text-[#167d3c]">{isBooked ? "✓ Booked" : "✓ Offer accepted"}</p><p className="mt-2 text-sm font-bold text-[#526078]">Agreed price</p><p className="text-2xl font-black">{formatMarketplaceAmount(amount)}</p>{state === "payment_required" && <><p className="mt-2 font-black text-[#8a5a00]">Payment required</p><p className="mt-1 text-sm text-[#526078]">Complete payment to confirm your booking.</p></>}{state === "payment_processing" && <p className="mt-2 font-black text-[#8a5a00]">Payment processing</p>}{isBooked && <p className="mt-2 font-black text-[#167d3c]">✓ Paid · Your provider is booked.</p>}</div> : <><p className="mt-3 font-black text-[#167d3c]">Budget · {budget}</p><p className="mt-2 text-sm font-bold text-[#526078]">{activeQuotes.length} {activeQuotes.length === 1 ? "offer" : "offers"} received</p></>}</Link><div className="mt-4 flex flex-wrap items-center gap-3">{state === "payment_required" && acceptedQuote && <Link href={jobHref} className="rounded-xl bg-[#23a955] px-4 py-3 font-black text-[#061b3f]">Book &amp; pay {formatMarketplaceAmount(amount)}</Link>}{isBooked && conversationIds.length === 1 && <Link href={activityHref} className="font-black text-[#167d3c]">Message provider →</Link>}{!acceptedQuote && activeQuotes.length > 0 && <Link href={jobHref} className="font-black text-[#167d3c]">Review {activeQuotes.length === 1 ? "offer" : "offers"} →</Link>}{!acceptedQuote && activeQuotes.length === 0 && <span className="font-black text-[#657089]">Waiting for offers →</span>}{state === "payment_processing" && <Link href={jobHref} className="font-black text-[#167d3c]">View booking →</Link>}{acceptedQuote && !isBooked && state !== "payment_processing" && <Link href={activityHref} className="font-black text-[#167d3c]">View activity →</Link>}</div></article>; }

function MobileMyJobs({ jobs }: { jobs: JobView[] }) { return <section className="px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7"><p className="text-[13px] font-black uppercase tracking-[.12em] text-[#159548]">MY JOBS</p><h1 className="mt-1 text-[34px] font-black tracking-[-.06em]">My jobs</h1><div className="mt-5 grid gap-4">{jobs.map((item) => <MobileJobCard key={item.job.id} item={item} />)}{!jobs.length && <Empty text="You haven’t posted a job yet." />}</div><MobileBottomNav active="my-jobs" /></section>; }

function MobileJobCard({ item }: { item: JobView }) { const { job, activeQuotes, acceptedQuote, state, jobHref, title, amount, budget } = item; const isBooked = state === "booked"; const metadataBudget = acceptedQuote ? `Agreed ${formatMarketplaceAmount(amount)}` : `Budget ${budget}`; const mobileStatus = state === "waiting_offers" ? "Waiting" : state === "offers_received" ? "Offers" : state === "payment_required" ? "Payment due" : state === "payment_processing" ? "Payment pending" : "Paid"; return <Link href={jobHref} className="relative block min-h-[154px] rounded-[22px] border border-[#e7ebef] bg-white p-[18px] shadow-[0_2px_10px_rgba(6,27,63,0.03)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23a955]/30"><div className="pr-24"><h2 className="line-clamp-2 text-[19px] font-black leading-6 capitalize">{title}</h2></div><span className={`absolute right-12 top-[18px] max-w-[104px] whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold leading-4 ${isBooked ? "bg-[#dff4e4] text-[#167d3c]" : state === "payment_required" || state === "payment_processing" ? "bg-[#fff8e8] text-[#8a5a00]" : "bg-[#eef8f1] text-[#167d3c]"}`}>{mobileStatus}</span><span aria-hidden="true" className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl font-light leading-none text-[#061b3f]">›</span><p className="mt-6 text-[14px] text-[#526078]">⌖ {job.postcode} <span className="mx-1.5">•</span> <span className="font-black text-[#167d3c]">{metadataBudget}</span></p><p className="mt-2 text-[14px] font-bold text-[#526078]">{activeQuotes.length} {activeQuotes.length === 1 ? "offer" : "offers"} received</p></Link>; }

function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-10 text-center text-[#657089]">{text}<Link href="/#job-composer" className="mt-3 block font-black text-[#167d3c]">Post a job →</Link></div>; }
