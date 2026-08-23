import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { marketplaceServices } from "@/app/data/marketplace";
import { chooseMarketplaceQuote, startCustomerConversation } from "@/app/jobs/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type QuoteContext = { token: string; quoteId: string; quoteAmount: number; quoteStatus: string; conversationId: string | null; bookingPaid: boolean };

function safeReturnTo(value: string | undefined, fallback: string) {
  return value && (value.startsWith("/jobs/") || value.startsWith("/messages/")) && !value.startsWith("//") ? value : fallback;
}

function MessageAction({ context, name, providerId }: { context: QuoteContext; name: string; providerId: string }) {
  return context.conversationId ? <Link href={`/messages/${context.conversationId}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message {name}</Link> : <form action={startCustomerConversation}><input type="hidden" name="token" value={context.token} /><input type="hidden" name="providerId" value={providerId} /><button className="min-h-11 rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message {name}</button></form>;
}

function ChooseAction({ context, name, returnTo }: { context: QuoteContext; name: string; returnTo: string }) {
  return <form action={chooseMarketplaceQuote}><input type="hidden" name="token" value={context.token} /><input type="hidden" name="quoteId" value={context.quoteId} /><input type="hidden" name="returnTo" value={returnTo} /><button className="min-h-11 rounded-xl bg-[#061b3f] px-4 font-black text-white">Choose {name} — £{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</button></form>;
}

export default async function PublicProviderProfile({ params, searchParams }: { params: Promise<{ providerId: string }>; searchParams: Promise<{ job?: string; offer?: string; returnTo?: string }> }) {
  const { providerId } = await params;
  const query = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { data: services }, { data: areas }, { data: reviews }, { count: completedJobs }] = await Promise.all([
    admin.from("cleaner_profiles").select("display_name,business_name,marketplace_bio,profile_photo_url,years_experience,provider_status").eq("user_id", providerId).eq("provider_status", "approved").maybeSingle(),
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug").eq("provider_id", providerId).eq("active", true),
    admin.from("marketplace_provider_service_areas").select("postcode_district").eq("provider_id", providerId).eq("active", true).order("postcode_district"),
    admin.from("marketplace_reviews").select("rating,review_text,created_at").eq("provider_id", providerId).order("created_at", { ascending: false }).limit(10),
    admin.from("marketplace_bookings").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "completed"),
  ]);
  if (!profile) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data : null;
  let context: QuoteContext | null = null;
  if (query.job && query.offer && customer) {
    const [{ data: job }, { data: quote }] = await Promise.all([
      admin.from("marketplace_jobs").select("id,public_token,customer_id").eq("public_token", query.job).eq("customer_id", customer.id).maybeSingle(),
      admin.from("marketplace_quotes").select("id,job_id,provider_id,bidder_user_id,amount_pence,status").eq("id", query.offer).maybeSingle(),
    ]);
    if (job && quote && quote.job_id === job.id && (quote.provider_id === providerId || quote.bidder_user_id === providerId)) {
      const [{ data: conversation }, { data: booking }] = await Promise.all([
        admin.from("marketplace_conversations").select("id").eq("job_id", job.id).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).maybeSingle(),
        admin.from("marketplace_bookings").select("conversation_id,payment_status").eq("quote_id", quote.id).maybeSingle(),
      ]);
      context = { token: job.public_token, quoteId: quote.id, quoteAmount: quote.amount_pence, quoteStatus: quote.status, conversationId: booking?.conversation_id || conversation?.id || null, bookingPaid: booking?.payment_status === "paid" };
    }
  }
  const photoUrl = profile.profile_photo_url ? (await admin.storage.from("marketplace-provider-photos").createSignedUrl(profile.profile_photo_url, 3600)).data?.signedUrl : null;
  const serviceRows = services || [];
  const areaRows = areas || [];
  const reviewRows = reviews || [];
  const averageRating = reviewRows.length ? reviewRows.reduce((sum, review) => sum + Number(review.rating), 0) / reviewRows.length : null;
  const name = profile.business_name || profile.display_name || "Quickola provider";
  const serviceLabels = serviceRows.map((item) => { const category = marketplaceServices.find((service) => service.slug === item.category_slug); const job = category?.jobs.find((candidate) => candidate.slug === item.job_type_slug); return job?.name || category?.name || item.job_type_slug.replaceAll("-", " "); });
  const categoryLabels = [...new Set(serviceRows.map((item) => marketplaceServices.find((service) => service.slug === item.category_slug)?.name || item.category_slug.replaceAll("-", " ")))];
  const returnTo = safeReturnTo(query.returnTo, query.job ? `/jobs/${query.job}` : "/messages");
  const canChoose = context && ["submitted", "pending"].includes(context.quoteStatus) && !context.bookingPaid;
  return <main className={`min-h-screen bg-[#f7f8fa] text-[#061b3f] ${context ? "pb-28 sm:pb-0" : ""}`}><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10"><Link href={returnTo} className="text-sm font-black text-[#167d3c]">← {query.job ? "Back to job" : "Back to messages"}</Link><article className="mt-5 overflow-hidden sm:rounded-3xl sm:border sm:border-[#e7ebef] sm:bg-white"><header className="border-b border-[#edf0f3] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center">{photoUrl ? <img src={photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover sm:h-24 sm:w-24" /> : <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#eef8f1] text-3xl font-black text-[#167d3c] sm:h-24 sm:w-24" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>}<div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola provider</p><h1 className="mt-2 text-3xl font-black">{name}</h1><div className="mt-3 flex flex-wrap gap-2">{profile.provider_status === "approved" && <span className="rounded-full bg-[#eef8f1] px-3 py-1 text-xs font-black text-[#167d3c]">Quickola approved ✓</span>}{reviewRows.length ? <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">★ {averageRating?.toFixed(1)} · {reviewRows.length} review{reviewRows.length === 1 ? "" : "s"}</span> : <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">New to Quickola</span>}{profile.years_experience != null && <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">{profile.years_experience} years experience</span>}{categoryLabels[0] && <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">{categoryLabels[0]}</span>}</div></div></div></header><div className="grid gap-8 p-6 sm:p-8">{context && <section className="rounded-2xl border border-[#dce7df] bg-[#f5fbf6] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">{name}&apos;s quote</p><p className="mt-2 text-3xl font-black">£{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</p>{context.bookingPaid ? <p className="mt-2 font-black text-[#167d3c]">Booked and paid ✓</p> : ["accepted", "selected"].includes(context.quoteStatus) ? <p className="mt-2 font-bold text-[#526078]">This quote has been selected. Continue to payment from your job.</p> : <div className="mt-4 flex flex-wrap gap-3"><MessageAction context={context} name={name} providerId={providerId} />{canChoose && <ChooseAction context={context} name={name} returnTo={returnTo} />}</div>}</section>}{profile.marketplace_bio && <section><h2 className="text-xl font-black">About {name}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#39465b]">{profile.marketplace_bio.trim()}</p></section>}{categoryLabels.length > 0 && <section><h2 className="text-xl font-black">Services</h2><div className="mt-3 flex flex-wrap gap-2">{serviceLabels.map((label) => <span key={label} className="rounded-full bg-[#eef8f1] px-3 py-2 text-sm font-bold text-[#167d3c]">{label}</span>)}</div></section>}{areaRows.length > 0 && <section><h2 className="text-xl font-black">Areas covered</h2><div className="mt-3 flex flex-wrap gap-2">{areaRows.map((area) => <span key={area.postcode_district} className="rounded-full bg-[#f7f8fa] px-3 py-2 text-sm font-bold">{area.postcode_district}</span>)}</div></section>}{reviewRows.length > 0 ? <section><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-black">Reviews</h2><p className="font-black">★ {averageRating?.toFixed(1)} · {reviewRows.length} reviews</p></div><div className="mt-3 grid gap-3">{reviewRows.map((review) => <article key={`${review.created_at}-${review.rating}`} className="rounded-2xl bg-[#f7f8fa] p-4"><p className="font-black">{"★".repeat(Number(review.rating))}</p>{review.review_text && <p className="mt-2 leading-6 text-[#39465b]">{review.review_text}</p>}<time className="mt-2 block text-xs text-[#8390a1]">{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(review.created_at))}</time></article>)}</div></section> : <section className="rounded-2xl bg-[#f7f8fa] p-5"><h2 className="text-xl font-black">New to Quickola</h2><p className="mt-2 text-[#657089]">{name} hasn&apos;t received a review yet.</p></section>}{completedJobs ? <p className="font-black text-[#167d3c]">{completedJobs} job{completedJobs === 1 ? "" : "s"} completed</p> : null}</div></article></section>{context && <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#dbe1ea] bg-white/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-black">{name}&apos;s quote · £{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</p><div className="flex shrink-0 gap-2"><MessageAction context={context} name="Message" providerId={providerId} />{canChoose && <ChooseAction context={context} name="" returnTo={returnTo} />}</div></div></div>}</main>;
}
