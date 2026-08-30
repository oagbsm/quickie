import Link from "next/link";
import { redirect } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MobileBottomNav from "@/app/components/marketplace/MobileBottomNav";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { ACTIVE_MARKETPLACE_OFFER_STATUSES, formatMarketplaceAmount, getCustomerJobLifecycleLabel, getCustomerJobLifecycleState, getMarketplaceQuoteProviderId, normalizeMarketplaceRelation } from "@/lib/marketplace/customer-job-state";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import { formatMarketplaceProviderName } from "@/lib/marketplace/presentation";

type Quote = { id: string; amount_pence: number; status: string; provider_id?: string | null; bidder_user_id?: string | null };
type Booking = { quote_id: string; amount_pence: number; payment_status?: string | null; stripe_checkout_session_id?: string | null; status?: string | null; completion_status?: string | null };
type PostedRow = { id: string; public_token: string | null; service: string; service_subtype: string | null; postcode: string; requested_timing?: string | null; budget_amount: number | null; marketplace_quotes?: Quote[] | Quote; marketplace_bookings?: Booking[] | Booking };
type JobView = { job: { id: string; public_token: string | null; service: string; service_subtype: string | null; postcode: string; requested_timing?: string | null; budget_amount: number | null }; activeQuotes: Quote[]; acceptedQuote?: Quote; booking?: Booking; providerName?: string; state: string; statusLabel: string; conversationIds: string[]; latestMessageAt?: string; jobHref: string; title: string; amount?: number; budget: string };

export default async function MyJobsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/my-jobs");
  const account = await getCurrentAccountContext();
  if (account.role !== "customer") redirect(destinationForAccount(account) || "/");
  if (await getApprovedMarketplaceProvider()) redirect("/work");
  const admin = createSupabaseAdminClient();
  const { data: customer, error: customerError } = await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle();
  const extendedSelect = "id,public_token,service,service_subtype,postcode,requested_timing,budget_amount,status,created_at,marketplace_quotes(id,amount_pence,status,provider_id,bidder_user_id),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at,status,completion_status,scheduled_date,arrival_window_start,arrival_window_end)";
  const legacySelect = "id,public_token,service,service_subtype,postcode,requested_timing,budget_amount,status,created_at,marketplace_quotes(id,amount_pence,status,provider_id,bidder_user_id),marketplace_bookings(id,quote_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at)";
  let posted: PostedRow[] | null = null;
  let postedError = customerError || (!customer ? { code: "customer_not_found", message: "No marketplace customer record for authenticated user" } : null);
  if (customer && !customerError) {
    const extended = await admin.from("marketplace_jobs").select(extendedSelect).eq("customer_id", customer.id).order("created_at", { ascending: false });
    posted = extended.data;
    postedError = extended.error;
    if (extended.error) {
      console.error("[my-jobs] Extended job query failed; attempting legacy projection", { userId: user.id, customerId: customer.id, code: extended.error.code, message: extended.error.message, details: extended.error.details || null, hint: extended.error.hint || null, table: "marketplace_jobs", projection: extendedSelect });
      const legacy = await admin.from("marketplace_jobs").select(legacySelect).eq("customer_id", customer.id).order("created_at", { ascending: false });
      posted = legacy.data;
      postedError = legacy.error;
      if (legacy.error && /budget_amount/i.test(legacy.error.message)) {
        const noBudget = await admin.from("marketplace_jobs").select(legacySelect.replace(",budget_amount", "")).eq("customer_id", customer.id).order("created_at", { ascending: false });
        posted = (noBudget.data as Array<Omit<PostedRow, "budget_amount">> | null)?.map((job) => ({ ...job, budget_amount: null })) ?? null;
        postedError = noBudget.error;
      }
    }
  }
  if (postedError) {
    console.error("[my-jobs] Job query failed", { userId: user.id, customerId: customer?.id || null, code: postedError.code, message: postedError.message, details: "details" in postedError ? postedError.details || null : null, hint: "hint" in postedError ? postedError.hint || null : null });
    return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><div className="hidden md:block"><section className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><ErrorState /></section></div><div className="md:hidden"><MobileMyJobs jobs={[]} error /></div></main>;
  }
  const jobIds = (posted || []).map((job) => job.id);
  const { data: conversations } = jobIds.length ? await admin.from("marketplace_conversations").select("id,job_id").in("job_id", jobIds) : { data: [] };
  const conversationIds = (conversations || []).map((conversation) => conversation.id);
  const { data: latestMessages } = conversationIds.length ? await admin.from("marketplace_messages").select("conversation_id,created_at").in("conversation_id", conversationIds).order("created_at", { ascending: false }) : { data: [] };
  const latestMessageByJob = new Map<string, string>();
  for (const conversation of conversations || []) {
    const latest = (latestMessages || []).find((message) => message.conversation_id === conversation.id);
    if (latest && !latestMessageByJob.has(conversation.job_id)) latestMessageByJob.set(conversation.job_id, latest.created_at);
  }
  const providerIds = (posted || []).flatMap((job) => normalizeMarketplaceRelation(job.marketplace_quotes).map((quote) => getMarketplaceQuoteProviderId(quote as Quote)).filter(Boolean) as string[]);
  const { data: providerProfiles } = providerIds.length ? await admin.from("marketplace_providers").select("user_id,display_name,business_name").in("user_id", [...new Set(providerIds)]) : { data: [] };
  const providerNames = new Map((providerProfiles || []).map((profile) => [profile.user_id, profile.business_name || profile.display_name || "Your provider"]));
  const conversationIdsByJob = new Map<string, string[]>();
  for (const conversation of conversations || []) conversationIdsByJob.set(conversation.job_id, [...(conversationIdsByJob.get(conversation.job_id) || []), conversation.id]);
  const jobs = (posted || []).map((job) => {
    const quotes = normalizeMarketplaceRelation(job.marketplace_quotes) as Quote[];
    const activeQuotes = quotes.filter((quote) => ACTIVE_MARKETPLACE_OFFER_STATUSES.includes(quote.status as (typeof ACTIVE_MARKETPLACE_OFFER_STATUSES)[number]));
    const acceptedQuote = activeQuotes.find((quote) => ["accepted", "selected"].includes(quote.status));
    const bookings = normalizeMarketplaceRelation(job.marketplace_bookings) as Booking[];
    const booking = acceptedQuote ? bookings.find((item) => item.quote_id === acceptedQuote.id) : undefined;
    const state = getCustomerJobLifecycleState({ offerCount: activeQuotes.length, acceptedQuote, booking });
    const providerId = acceptedQuote?.provider_id || acceptedQuote?.bidder_user_id;
    return { job, activeQuotes, acceptedQuote, booking, providerName: providerId ? formatMarketplaceProviderName(providerNames.get(providerId)) : undefined, state, statusLabel: getCustomerJobLifecycleLabel(state), conversationIds: conversationIdsByJob.get(job.id) || [], latestMessageAt: latestMessageByJob.get(job.id), jobHref: `/jobs/${job.public_token}`, title: (job.service_subtype || job.service).replaceAll("-", " "), amount: acceptedQuote?.amount_pence ?? booking?.amount_pence, budget: job.budget_amount == null ? "Open budget" : formatMarketplaceAmount(Number(job.budget_amount) * 100) } as JobView;
  });
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><div className="hidden md:block"><DesktopMyJobs jobs={jobs} /></div><div className="md:hidden"><MobileMyJobs jobs={jobs} /></div></main>;
}

function DesktopMyJobs({ jobs }: { jobs: JobView[] }) { return <section className="mx-auto max-w-4xl px-5 py-10 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-black text-[#159548]">MY JOBS</p><h1 className="mt-2 text-4xl font-black">My jobs</h1></div><Link href="/#job-composer" className="rounded-xl bg-[#23a955] px-5 py-3 font-black text-[#061b3f]">Post a job</Link></div><div className="mt-6 grid gap-4">{jobs.map((item) => <DesktopJobCard key={item.job.id} item={item} />)}{!jobs.length && <Empty text="You haven’t posted a job yet." />}</div></section>; }

function DesktopJobCard({ item }: { item: JobView }) { const { job, activeQuotes, acceptedQuote, providerName, state, conversationIds, jobHref, title, amount, budget } = item; const isBooked = !["waiting_for_offers", "offers_received", "provider_selected_unpaid", "payment_pending"].includes(state); const activityHref = conversationIds.length === 1 ? `/messages/${conversationIds[0]}` : jobHref; const prices = activeQuotes.map((quote) => quote.amount_pence).filter(Number.isFinite); const priceRange = prices.length ? `${formatMarketplaceAmount(Math.min(...prices))}${prices.length > 1 ? ` – ${formatMarketplaceAmount(Math.max(...prices))}` : ""}` : null; return <article className="rounded-3xl border border-[#e7ebef] bg-white p-6 transition-shadow hover:shadow-[0_8px_28px_rgba(6,27,63,0.06)]"><Link href={jobHref} className="block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23a955]/30"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black capitalize">{title}</h2><p className="mt-2 text-sm text-[#526078]">{job.postcode}{job.requested_timing ? ` · ${job.requested_timing}` : ""}</p></div><span className="text-right text-sm font-black text-[#167d3c]">{getJobActivity(item)}</span></div>{acceptedQuote ? <div className={`mt-5 border-t pt-4 ${isBooked ? "border-[#dcefe0]" : "border-[#f1e5c9]"}`}><p className="font-black text-[#167d3c]">{isBooked ? `Booked${providerName ? ` with ${providerName}` : ""}` : "Provider selected"}</p><p className="mt-2 text-sm font-bold text-[#526078]">Agreed price</p><p className="text-2xl font-black">{formatMarketplaceAmount(amount)}</p>{state === "provider_selected_unpaid" && <p className="mt-2 font-black text-[#8a5a00]">Payment required</p>}{state === "payment_pending" && <p className="mt-2 font-black text-[#8a5a00]">Payment confirming</p>}{state === "completed" && <p className="mt-2 font-black text-[#167d3c]">Job complete</p>}</div> : <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-[#f0f2f5] pt-4"><div><p className="font-black text-[#167d3c]">{getJobActivity(item)}</p><p className="mt-2 text-sm text-[#526078]">{priceRange || `Budget · ${budget}`}</p></div><p className="text-sm font-black text-[#167d3c]">{conversationIds.length} {conversationIds.length === 1 ? "conversation" : "conversations"}</p></div>}</Link><div className="mt-5 flex flex-wrap items-center gap-4">{state === "provider_selected_unpaid" && acceptedQuote && <Link href={jobHref} className="min-h-11 rounded-xl bg-[#23a955] px-4 py-3 font-black text-[#061b3f]">Confirm &amp; pay {formatMarketplaceAmount(amount)}</Link>}{isBooked && conversationIds.length === 1 && <Link href={activityHref} className="min-h-11 py-2 font-black text-[#167d3c]">Message {providerName || "provider"} →</Link>}{!acceptedQuote && activeQuotes.length > 0 && <Link href={jobHref} className="min-h-11 py-2 font-black text-[#167d3c]">Review {activeQuotes.length === 1 ? "offer" : "offers"} →</Link>}{!acceptedQuote && activeQuotes.length === 0 && <Link href={jobHref} className="min-h-11 py-2 font-black text-[#167d3c]">View job →</Link>}{state === "payment_pending" && <Link href={jobHref} className="min-h-11 py-2 font-black text-[#167d3c]">View booking →</Link>}{acceptedQuote && !isBooked && state !== "payment_pending" && <Link href={activityHref} className="min-h-11 py-2 font-black text-[#167d3c]">View activity →</Link>}</div></article>; }

function MobileMyJobs({ jobs, error = false }: { jobs: JobView[]; error?: boolean }) { return <section className="px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7"><p className="text-[13px] font-black uppercase tracking-[.12em] text-[#159548]">MY JOBS</p><h1 className="mt-1 text-[34px] font-black tracking-[-.06em]">My jobs</h1><div className="mt-5 grid gap-4">{error ? <ErrorState /> : jobs.map((item) => <MobileJobCard key={item.job.id} item={item} />)}{!error && !jobs.length && <Empty text="You haven’t posted a job yet." />}</div><MobileBottomNav active="my-jobs" /></section>; }

function MobileJobCard({ item }: { item: JobView }) { const { job, activeQuotes, acceptedQuote, providerName, state, jobHref, title, amount, budget, conversationIds, latestMessageAt } = item; const isBooked = !["waiting_for_offers", "offers_received", "provider_selected_unpaid", "payment_pending"].includes(state); const metadataBudget = acceptedQuote ? `Agreed ${formatMarketplaceAmount(amount)}` : activeQuotes.length ? `${activeQuotes.length} ${activeQuotes.length === 1 ? "offer" : "offers"} received` : `Budget · ${budget}`; return <Link href={jobHref} className="block rounded-[22px] border border-[#e7ebef] bg-white p-5 shadow-[0_2px_10px_rgba(6,27,63,0.03)] transition-shadow hover:shadow-[0_8px_24px_rgba(6,27,63,0.06)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#23a955]/30"><div className="flex items-start gap-3"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#eef8f1] text-xl text-[#167d3c]" aria-hidden="true">⌂</div><div className="min-w-0 flex-1"><h2 className="line-clamp-2 text-[19px] font-black leading-6 capitalize">{title}</h2><p className="mt-1 text-[14px] text-[#526078]">{job.postcode}{job.requested_timing ? ` · ${job.requested_timing}` : ""}</p></div><span aria-hidden="true" className="text-2xl font-light leading-none text-[#061b3f]">›</span></div><div className="mt-5 border-t border-[#f0f2f5] pt-4"><div className="flex items-center justify-between gap-3"><p className="rounded-full bg-[#eef8f1] px-3 py-1 text-[13px] font-black text-[#167d3c]">{getJobActivity(item)} {isBooked && "✓"}</p><p className="text-[14px] font-black text-[#526078]">{metadataBudget}</p></div>{isBooked && providerName && <div className="mt-4 flex items-center justify-between gap-3 text-[14px]"><span className="text-[#526078]">Booked with</span><span className="font-black">{providerName}</span></div>}{conversationIds.length > 0 && <div className="mt-3 flex items-center justify-between gap-3 text-[14px]"><span className="text-[#526078]">Conversations</span><span className="font-black">{conversationIds.length}</span></div>}{latestMessageAt && <div className="mt-3 flex items-center justify-between gap-3 text-[13px]"><span className="text-[#526078]">Last message</span><time dateTime={latestMessageAt} className="font-bold text-[#526078]">{new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(latestMessageAt))}</time></div>}</div><div className="mt-4 border-t border-[#f0f2f5] pt-3 text-right text-sm font-black text-[#167d3c]">View details <span aria-hidden="true">›</span></div></Link>; }

function getJobActivity(item: JobView) { if (item.state === "waiting_for_offers") return "Waiting for offers"; if (item.state === "offers_received") return `${item.activeQuotes.length} ${item.activeQuotes.length === 1 ? "offer" : "offers"} received`; if (item.state === "provider_selected_unpaid") return "Provider selected"; return item.statusLabel; }

function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-[#cfd8d2] bg-white p-10 text-center text-[#657089]">{text}<Link href="/#job-composer" className="mt-3 block font-black text-[#167d3c]">Post a job →</Link></div>; }
function ErrorState() { return <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-900"><p className="font-black">We couldn’t load your jobs.</p><p className="mt-1">Please refresh and try again.</p></div>; }
