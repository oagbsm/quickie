import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import MobileBottomNav from "@/app/components/marketplace/MobileBottomNav";
import { getJob, getService } from "@/app/data/marketplace";
import { chooseMarketplaceQuote, confirmMarketplaceCompletion, reportMarketplaceCompletionIssue, startCustomerConversation, submitMarketplaceOffer, submitMarketplaceReview } from "@/app/jobs/actions";
import { createMarketplaceCheckout } from "@/app/jobs/payment-actions";
import { getOperationalMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_MARKETPLACE_OFFER_STATUSES, formatMarketplaceAmount, formatMarketplaceSchedule, getCustomerJobLifecycleState, getMarketplacePaymentState, getMarketplaceQuoteProviderId } from "@/lib/marketplace/customer-job-state";
import CustomerJobManageMenu from "@/app/jobs/CustomerJobManageMenu";

export const metadata: Metadata = { title: "Quickola job", robots: { index: false, follow: false } };

function relativePostedAt(value: string) { const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return "just now"; if (seconds < 3600) return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) === 1 ? "" : "s"} ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour${Math.floor(seconds / 3600) === 1 ? "" : "s"} ago`; if (seconds < 172800) return "yesterday"; return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)); }

export default async function JobPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ offered?: string; error?: string; payment?: string }> }) {
  const { token } = await params;
  const { offered, error: offerError, payment } = await searchParams;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("marketplace_jobs").select("id,customer_id,service,service_subtype,pricing_answers,postcode,requested_timing,optional_note,budget_amount,status,created_at").eq("public_token", token).maybeSingle();
  if (error || !data) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data : null;
  const isOwner = Boolean(customer && customer.id === data.customer_id);
  const provider = user && !isOwner ? await getOperationalMarketplaceProvider() : null;
  const service = getService(data.service);
  const selectedJob = getJob(data.service, data.service_subtype);
  const { data: quoteRows } = await admin.from("marketplace_quotes").select("id,amount_pence,availability_text,message,status,provider_id,bidder_user_id,scheduled_date,arrival_window_start,arrival_window_end").eq("job_id", data.id).in("status", [...ACTIVE_MARKETPLACE_OFFER_STATUSES]).order("created_at", { ascending: true });
  const quoteProviderIds = [...new Set((quoteRows || []).map(getMarketplaceQuoteProviderId).filter(Boolean))];
  const { data: quoteProviderProfiles } = quoteProviderIds.length ? await admin.from("marketplace_providers").select("user_id,display_name,business_name,profile_photo_url").in("user_id", quoteProviderIds) : { data: [] };
  const quoteProfilesById = new Map((quoteProviderProfiles || []).map((profile) => [profile.user_id, profile]));
  const quotes = (quoteRows || []).map((quote) => ({ ...quote, marketplace_providers: quoteProfilesById.get(getMarketplaceQuoteProviderId(quote) || "") || null }));
  const { data: conversations } = isOwner ? await admin.from("marketplace_conversations").select("id,provider_id,bidder_user_id").eq("job_id", data.id) : { data: [] };
  const conversationByProvider = new Map((conversations || []).map((item) => [item.provider_id || item.bidder_user_id, item.id]));
  const { data: bookings } = isOwner ? await admin.from("marketplace_bookings").select("id,quote_id,conversation_id,amount_pence,payment_status,stripe_checkout_session_id,paid_at,status,completion_status,scheduled_date,arrival_window_start,arrival_window_end,provider_arrived_at,provider_finished_at,customer_completed_at,provider_id,marketplace_providers(display_name,business_name,profile_photo_url)").eq("job_id", data.id) : { data: [] };
  const { data: jobPhotos } = isOwner ? await admin.from("marketplace_job_photos").select("id,storage_path").eq("job_id", data.id).order("created_at", { ascending: true }) : { data: [] };
  const photos = await Promise.all((jobPhotos || []).map(async (photo) => ({ id: photo.id, url: (await admin.storage.from("marketplace-job-photos").createSignedUrl(photo.storage_path, 3600)).data?.signedUrl || null })));
  const bookingByQuote = new Map((bookings || []).map((booking) => [booking.quote_id, booking]));
  const acceptedQuote = quotes?.find((quote) => ["accepted", "selected"].includes(quote.status));
  const acceptedBooking = acceptedQuote ? bookingByQuote.get(acceptedQuote.id) : null;
  const lifecycle = isOwner ? getCustomerJobLifecycleState({ offerCount: quotes?.length || 0, acceptedQuote, booking: acceptedBooking }) : null;
  const title = selectedJob?.name || service?.name || data.service;
  const acceptedProfile = Array.isArray(acceptedQuote?.marketplace_providers) ? acceptedQuote.marketplace_providers[0] : acceptedQuote?.marketplace_providers;
  const providerName = acceptedProfile?.business_name || acceptedProfile?.display_name || "Your provider";
  const acceptedProviderId = acceptedQuote?.provider_id || acceptedQuote?.bidder_user_id || null;
  const schedule = formatMarketplaceSchedule(acceptedBooking || acceptedQuote || null);
  const review = acceptedBooking ? (await admin.from("marketplace_reviews").select("rating,review_text,created_at").eq("booking_id", acceptedBooking.id).maybeSingle()).data : null;
  const canManage = isOwner && !acceptedQuote && ["posted", "finding_provider", "provider_available"].includes(data.status);
  return <main className="min-h-screen bg-white text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 pb-[calc(7rem+env(safe-area-inset-bottom))] py-7 sm:px-8 sm:py-12 sm:pb-16"><Link href="/my-jobs" className="text-sm font-black text-[#167d3c]">← My jobs</Link><div className="mt-4 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-9"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[#159548]">{isOwner ? "Your job" : "Local job"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.06em]">{title}</h1><p className="mt-4 text-sm text-[#526078]">{data.postcode} · {data.requested_timing || "Flexible timing"}</p></div>{isOwner && <CustomerJobManageMenu token={token} canManage={canManage} note={data.optional_note} timing={data.requested_timing} budget={data.budget_amount} />}</div>{isOwner && !acceptedQuote && <Detail offerCount={quotes?.length || 0} createdAt={data.created_at} />}{isOwner && acceptedQuote && acceptedBooking && lifecycle && <BookingPanel token={token} jobId={data.id} booking={acceptedBooking} quote={acceptedQuote} lifecycle={lifecycle} providerName={providerName} providerId={acceptedProviderId} schedule={schedule} review={review} />}{["stripe_config", "payment_setup", "payment"].includes(offerError || "") && <p className="mt-5 rounded-xl bg-red-50 p-4 font-bold text-red-800">Payment could not be started. Your accepted offer is safe. Please try again.</p>}{payment === "cancelled" && <p className="mt-5 rounded-xl bg-[#f7f8fa] p-4 font-bold text-[#526078]">Payment was cancelled. Your accepted offer is still available.</p>}{payment === "success" && <p className="mt-5 rounded-xl bg-[#eef8f1] p-4 font-bold text-[#167d3c]">Payment submitted. We&apos;ll confirm your booking after Stripe verifies it.</p>}{!isOwner && provider && <ProviderOfferForm token={token} offered={Boolean(offered)} error={offerError} />}{isOwner && !acceptedQuote && <Offers quotes={quotes || []} token={token} jobId={data.id} conversationByProvider={conversationByProvider} />}{isOwner && <JobDetails data={data} photos={photos} />}</div></section><div className="md:hidden"><MobileBottomNav /></div></main>;
}
function BookingPanel({ token, jobId, booking, quote, lifecycle, providerName, providerId, schedule, review }: { token: string; jobId: string; booking: { id: string; conversation_id?: string | null; amount_pence: number; payment_status?: string | null; stripe_checkout_session_id?: string | null; status?: string | null; completion_status?: string | null; scheduled_date?: string | null; arrival_window_start?: string | null; arrival_window_end?: string | null }; quote: { id: string; amount_pence: number }; lifecycle: ReturnType<typeof getCustomerJobLifecycleState>; providerName: string; providerId: string | null; schedule: ReturnType<typeof formatMarketplaceSchedule>; review: { rating: number; review_text: string | null } | null }) {
  const paymentState = getMarketplacePaymentState(booking);
  const paid = paymentState === "paid";
  const messageHref = booking.conversation_id ? `/messages/${booking.conversation_id}` : null;
  return <section className="mt-7 rounded-2xl border border-[#dce7df] bg-[#f5fbf6] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">{lifecycle === "completed" ? "Job complete ✓" : lifecycle === "awaiting_customer_completion" ? "Confirm job" : paid ? "Booking confirmed ✓" : "Provider selected"}</p><h2 className="mt-2 text-2xl font-black">{lifecycle === "booked" ? `${providerName} is coming` : lifecycle === "provider_on_the_way" ? `${providerName} is on the way` : lifecycle === "provider_arrived" ? `${providerName} has arrived` : lifecycle === "awaiting_customer_completion" ? `${providerName} has marked this job as finished.` : lifecycle === "completed" ? `${providerName} completed your job` : `You've chosen ${providerName}`}</h2>{providerId && <Link href={`/providers/${providerId}?job=${jobId}&offer=${quote.id}&returnTo=/jobs/${token}`} className="mt-2 inline-flex font-black text-[#167d3c]">View {providerName}&apos;s profile</Link>}{schedule.dateLabel && <p className="mt-4 font-black">{schedule.dateLabel}</p>}<p className="mt-1 font-bold text-[#526078]">{schedule.timeLabel}</p><p className="mt-3 font-black text-[#167d3c]">{paid ? `${formatMarketplaceAmount(booking.amount_pence || quote.amount_pence)} paid ✓` : `Agreed price · ${formatMarketplaceAmount(quote.amount_pence)}`}</p>{!paid && <><p className="mt-4 text-sm text-[#526078]">Complete payment to confirm your booking.</p><form action={createMarketplaceCheckout} className="mt-4"><input type="hidden" name="token" value={token} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={`/jobs/${token}`} /><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Confirm &amp; pay {formatMarketplaceAmount(quote.amount_pence)}</button></form></>}{paid && <BookingProgress lifecycle={lifecycle} />}{lifecycle === "awaiting_customer_completion" && <div className="mt-4 flex flex-wrap gap-3"><form action={confirmMarketplaceCompletion}><input type="hidden" name="token" value={token} /><input type="hidden" name="bookingId" value={booking.id} /><button className="min-h-11 rounded-xl bg-[#23a955] px-5 font-black text-[#061b3f]">Yes, job complete</button></form><form action={reportMarketplaceCompletionIssue}><input type="hidden" name="token" value={token} /><input type="hidden" name="bookingId" value={booking.id} /><button className="min-h-11 rounded-xl border border-[#dbe1ea] px-5 font-black">There&apos;s a problem</button></form></div>}{paid && messageHref && <Link href={messageHref} className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message {providerName}</Link>}{lifecycle === "completed" && !review && <form action={submitMarketplaceReview} className="mt-5 grid gap-3 border-t border-[#dce7df] pt-5"><p className="font-black">How did {providerName} do?</p><select name="rating" required defaultValue=""><option value="" disabled>Choose a rating</option>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} stars</option>)}</select><textarea name="review" maxLength={1000} placeholder="Optional short review" className="min-h-20 rounded-xl border border-[#dbe1ea] p-3" /><input type="hidden" name="token" value={token} /><input type="hidden" name="bookingId" value={booking.id} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 font-black text-white">Submit review</button></form>}{review && <p className="mt-4 font-black text-[#167d3c]">Your review: {"★".repeat(review.rating)} </p>}</section>;
}

function BookingProgress({ lifecycle }: { lifecycle: ReturnType<typeof getCustomerJobLifecycleState> }) {
  const complete = lifecycle === "completed";
  return <div className="mt-4 border-t border-[#dce7df] pt-4 text-sm font-bold text-[#526078]"><p className="text-[#167d3c]">✓ Booked</p><p className="mt-1">{complete ? "✓" : "○"} Complete</p></div>;
}

function ProviderOfferForm({ token, offered, error }: { token: string; offered: boolean; error?: string }) { return <section className="mt-8 border-t border-[#e9edf1] pt-7"><h2 className="text-2xl font-black">Send your offer</h2>{offered ? <p className="mt-3 rounded-xl bg-[#eaf8ee] p-4 font-bold text-[#167d3c]">Your offer has been sent.</p> : <form action={submitMarketplaceOffer} className="mt-4 grid gap-4"><label className="font-bold">Your price (£)<input name="amount" type="number" min="1" step="0.01" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="font-bold">Service date<input name="scheduledDate" type="date" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><div className="grid grid-cols-2 gap-3"><label className="font-bold">From<input name="arrivalWindowStart" type="time" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><label className="font-bold">Until<input name="arrivalWindowEnd" type="time" required className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label></div><label className="font-bold">Availability note<input name="availability" placeholder="e.g. I can arrive promptly" className="mt-2 min-h-12 w-full rounded-xl border px-4" /></label><input type="hidden" name="token" value={token} />{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">We couldn’t send your offer. Please try again.</p>}<button className="min-h-12 rounded-xl bg-[#23a955] font-black text-[#061b3f]">Send offer</button></form>}</section>; }

function Offers({ quotes, token, jobId, conversationByProvider }: { quotes: Array<{ id: string; amount_pence: number; availability_text?: string | null; message?: string | null; status: string; provider_id?: string | null; bidder_user_id?: string | null; marketplace_providers?: { display_name?: string; business_name?: string; profile_photo_url?: string | null } | { display_name?: string; business_name?: string; profile_photo_url?: string | null }[] | null }>; token: string; jobId: string; conversationByProvider: Map<string | null, string> }) {
  return <section className="mt-8 border-t border-[#e9edf1] pt-7">
    <div className="flex items-baseline justify-between gap-4"><h2 className="text-2xl font-black">Offers <span className="text-[#657089]">({quotes.length})</span></h2></div>
    {!quotes.length ? <div className="mt-4 border-t border-[#edf0f3] pt-5"><p className="font-black">No offers yet</p><p className="mt-1 text-sm text-[#657089]">Offers from local providers will appear here.</p></div> : <div className="mt-4 grid gap-3">{quotes.map((quote) => {
      const profile = Array.isArray(quote.marketplace_providers) ? quote.marketplace_providers[0] : quote.marketplace_providers;
      const providerId = getMarketplaceQuoteProviderId(quote);
      const name = profile?.business_name || profile?.display_name || "Local provider";
      const conversationId = providerId ? conversationByProvider.get(providerId) : undefined;
      return <article key={quote.id} className="rounded-2xl border border-[#e7ebef] bg-white p-5 shadow-[0_2px_12px_rgba(6,27,63,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {profile?.profile_photo_url ? <img src={profile.profile_photo_url} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef8f1] text-lg font-black text-[#167d3c]" aria-hidden="true">{name.charAt(0).toUpperCase()}</div>}
            <div className="min-w-0">{providerId ? <Link href={`/providers/${providerId}?job=${jobId}&offer=${quote.id}&returnTo=/jobs/${token}`} className="font-black text-[#061b3f]">{name}</Link> : <p className="font-black">{name}</p>}{quote.availability_text && <p className="mt-1 text-sm text-[#526078]">{quote.availability_text}</p>}</div>
          </div>
          <p className="shrink-0 text-2xl font-black">{formatMarketplaceAmount(quote.amount_pence)}</p>
        </div>
        {quote.message && <p className="mt-4 rounded-xl bg-[#f7f9fb] p-3 text-sm leading-6 text-[#39465b]">{quote.message}</p>}
        <div className="mt-4 flex flex-wrap gap-3">{providerId && (conversationId ? <Link href={`/messages/${conversationId}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message</Link> : <form action={startCustomerConversation}><input type="hidden" name="token" value={token} /><input type="hidden" name="providerId" value={providerId} /><button className="inline-flex min-h-11 items-center rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message</button></form>)}<form action={chooseMarketplaceQuote}><input type="hidden" name="token" value={token} /><input type="hidden" name="quoteId" value={quote.id} /><input type="hidden" name="returnTo" value={`/jobs/${token}`} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-5 font-black text-white">Choose {name} · {formatMarketplaceAmount(quote.amount_pence)}</button></form></div>
      </article>;
    })}</div>}
  </section>;
}

function formatJobLabel(key: string) {
  const labels: Record<string, string> = { cleanType: "Cleaning type", propertyType: "Property type", bedrooms: "Bedrooms", bathrooms: "Bathrooms", extras: "Extras", access: "Access details", urgency: "Timing" };
  return labels[key] || key.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatJobValue(value: unknown) {
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object" && value !== null) return Object.values(value as Record<string, unknown>).join(", ");
  return String(value).replaceAll("_", " ").replaceAll("-", " ");
}

function JobDetails({ data, photos }: { data: { service: string; service_subtype: string | null; pricing_answers: unknown; postcode: string; requested_timing: string | null; optional_note: string | null; budget_amount: number | null }; photos: Array<{ id: string; url: string | null }> }) {
  const answers = data.pricing_answers && typeof data.pricing_answers === "object"
    ? Object.entries(data.pricing_answers as Record<string, unknown>).filter(([key, value]) => {
        const normalized = key.toLowerCase().replaceAll("-", "_");
        return value !== null && value !== "" && !["service", "service_subtype", "postcode", "location", "requested_timing", "timing", "when", "budget"].includes(normalized);
      })
    : [];
  return <section className="mt-9 border-t border-[#edf0f3] pt-7">
    <h2 className="text-xl font-black">Job information</h2>
    {answers.length > 0 && <div className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm"><span className="text-[#526078]">{formatJobLabel(answers[0][0])} {formatJobValue(answers[0][1])}</span></div>}
    <p className="mt-2 text-sm font-bold text-[#526078]">{data.budget_amount == null ? "Open to offers" : `Budget · £${Number(data.budget_amount).toFixed(2).replace(/\\.00$/, "")}`}</p>
    {answers.length > 1 && <dl className="mt-4 grid gap-2 sm:grid-cols-2">{answers.slice(1).map(([key, value]) => <div key={key} className="flex justify-between gap-4 border-b border-[#f0f2f5] py-2 text-sm"><dt className="text-[#657089]">{formatJobLabel(key)}</dt><dd className="text-right font-bold">{formatJobValue(value)}</dd></div>)}</dl>}
    {data.optional_note && <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#39465b]">{data.optional_note}</p>}
    {photos.some((photo) => photo.url) && <div className="mt-5"><p className="text-sm font-black">Photos</p><div className="mt-2 grid grid-cols-3 gap-2">{photos.filter((photo): photo is { id: string; url: string } => !!photo.url).map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer"><img src={photo.url} alt="Job attachment" className="aspect-square w-full rounded-xl object-cover" /></a>)}</div></div>}
  </section>;
}

function Detail({ offerCount, createdAt }: { offerCount: number; createdAt?: string }) {
  const waiting = offerCount === 0;
  return <section className="mt-7 rounded-2xl border border-[#cfe9d7] bg-[#f5fbf6] p-5 sm:p-6">
    <p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">{waiting ? "Finding local people" : `${offerCount} ${offerCount === 1 ? "offer" : "offers"} received`}</p>
    <p className="mt-2 text-lg font-black">{waiting ? "Waiting for local providers" : "You have people ready to help"}</p>
    <p className="mt-1 text-sm leading-6 text-[#526078]">{waiting ? "Your job is live. We&apos;ll let you know when someone sends an offer." : "Compare their price, availability and message before choosing."}</p>
    {createdAt && <p className="mt-3 text-xs font-bold text-[#526078]">Posted {relativePostedAt(createdAt)}</p>}
  </section>;
}
