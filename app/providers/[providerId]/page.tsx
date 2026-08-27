import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { marketplaceServices } from "@/app/data/marketplace";
import { chooseMarketplaceQuote, startCustomerConversation } from "@/app/jobs/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMarketplaceSchedule } from "@/lib/marketplace/customer-job-state";

type QuoteContext = { token: string; quoteId: string; quoteAmount: number; quoteStatus: string; conversationId: string | null; bookingPaid: boolean; bookingStatus: string | null; schedule: ReturnType<typeof formatMarketplaceSchedule>; jobTitle: string; serviceSubtype: string; postcodeDistrict: string; requestedTiming: string; availabilityText: string };

function safeReturnTo(value: string | undefined, fallback: string) {
  return value && (value.startsWith("/jobs/") || value.startsWith("/messages/")) && !value.startsWith("//") ? value : fallback;
}

function MessageAction({ context, name, providerId }: { context: QuoteContext; name: string; providerId: string }) {
  return context.conversationId ? <Link href={`/messages/${context.conversationId}`} className="inline-flex min-h-11 items-center rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message {name}</Link> : <form action={startCustomerConversation}><input type="hidden" name="token" value={context.token} /><input type="hidden" name="providerId" value={providerId} /><button className="min-h-11 rounded-xl border border-[#167d3c] px-4 font-black text-[#167d3c]">Message {name}</button></form>;
}

function ChooseAction({ context, name, returnTo }: { context: QuoteContext; name: string; returnTo: string }) {
  return <form action={chooseMarketplaceQuote}><input type="hidden" name="token" value={context.token} /><input type="hidden" name="quoteId" value={context.quoteId} /><input type="hidden" name="returnTo" value={returnTo} /><button className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">Choose {name} — £{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</button></form>;
}

export default async function PublicProviderProfile({ params, searchParams }: { params: Promise<{ providerId: string }>; searchParams: Promise<{ job?: string; offer?: string; returnTo?: string }> }) {
  const { providerId } = await params;
  const query = await searchParams;
  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { data: services }, { data: areas }, { count: completedJobs }] = await Promise.all([
    admin.from("cleaner_profiles").select("display_name,business_name,marketplace_bio,profile_photo_url,years_experience,provider_status").eq("user_id", providerId).eq("provider_status", "approved").maybeSingle(),
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug").eq("provider_id", providerId).eq("active", true),
    admin.from("marketplace_provider_service_areas").select("postcode_district").eq("provider_id", providerId).eq("active", true).order("postcode_district"),
    admin.from("marketplace_bookings").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "completed"),
  ]);
  if (!profile) notFound();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const customer = user ? (await admin.from("marketplace_customers").select("id").eq("auth_user_id", user.id).maybeSingle()).data : null;
  let context: QuoteContext | null = null;
  if (query.job && query.offer && customer) {
    const [{ data: job }, { data: quote }] = await Promise.all([
      admin.from("marketplace_jobs").select("id,public_token,customer_id,service,service_subtype,postcode,requested_timing").eq("id", query.job).eq("customer_id", customer.id).maybeSingle(),
      admin.from("marketplace_quotes").select("id,job_id,provider_id,bidder_user_id,amount_pence,status,availability_text").eq("id", query.offer).maybeSingle(),
    ]);
    if (job && quote && quote.job_id === job.id && (quote.provider_id === providerId || quote.bidder_user_id === providerId)) {
      const [{ data: conversation }, { data: booking }] = await Promise.all([
        admin.from("marketplace_conversations").select("id").eq("job_id", job.id).or(`provider_id.eq.${providerId},bidder_user_id.eq.${providerId}`).maybeSingle(),
        admin.from("marketplace_bookings").select("conversation_id,payment_status,status,scheduled_date,arrival_window_start,arrival_window_end,amount_pence").eq("quote_id", quote.id).maybeSingle(),
      ]);
      context = { token: job.public_token, quoteId: quote.id, quoteAmount: booking?.amount_pence || quote.amount_pence, quoteStatus: quote.status, conversationId: booking?.conversation_id || conversation?.id || null, bookingPaid: booking?.payment_status === "paid", bookingStatus: booking?.status || null, schedule: formatMarketplaceSchedule(booking || quote), jobTitle: (job.service_subtype || job.service).replaceAll("-", " "), serviceSubtype: job.service_subtype, postcodeDistrict: String(job.postcode || "").trim().split(/\s+/)[0].toUpperCase(), requestedTiming: job.requested_timing || "Flexible timing", availabilityText: quote.availability_text || "Flexible availability" };
    }
  }
  const photoUrl = profile.profile_photo_url ? (await admin.storage.from("marketplace-provider-photos").createSignedUrl(profile.profile_photo_url, 3600)).data?.signedUrl : null;
  const serviceRows = services || [];
  const areaRows = areas || [];
  const name = profile.business_name || profile.display_name || "Quickola provider";
  const serviceLabels = serviceRows.map((item) => { const category = marketplaceServices.find((service) => service.slug === item.category_slug); const job = category?.jobs.find((candidate) => candidate.slug === item.job_type_slug); return job?.name || category?.name || item.job_type_slug.replaceAll("-", " "); });
  const categoryLabels = [...new Set(serviceRows.map((item) => marketplaceServices.find((service) => service.slug === item.category_slug)?.name || item.category_slug.replaceAll("-", " ")))];
  const relevantService = context ? serviceRows.find((item) => item.job_type_slug === context?.serviceSubtype) : null;
  const primaryServiceLabel = relevantService ? (marketplaceServices.find((service) => service.slug === relevantService.category_slug)?.jobs.find((job) => job.slug === relevantService.job_type_slug)?.name || relevantService.job_type_slug.replaceAll("-", " ")) : serviceLabels[0];
  const serviceMatch = Boolean(relevantService);
  const areaMatch = Boolean(context && areaRows.some((area) => area.postcode_district.toUpperCase() === context.postcodeDistrict));
  const returnTo = safeReturnTo(query.returnTo, context ? `/jobs/${context.token}` : "/messages");
  const canChoose = context && ["submitted", "pending"].includes(context.quoteStatus) && !context.bookingPaid;
  return <main className={`min-h-screen bg-[#f7f8fa] text-[#061b3f] ${context ? "pb-28 sm:pb-0" : ""}`}><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8 sm:pt-10"><Link href={returnTo} className="text-sm font-black text-[#167d3c]">← {query.job ? "Back to job" : "Back to messages"}</Link><article className="mt-5 overflow-hidden sm:rounded-3xl sm:border sm:border-[#e7ebef] sm:bg-white">{context && <section className="border-b border-[#edf0f3] px-6 py-5 sm:px-8"><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Your job</p><h2 className="mt-2 text-2xl font-black capitalize">{context.jobTitle}</h2><p className="mt-1 text-sm font-bold text-[#526078]">{context.postcodeDistrict} · {context.requestedTiming}</p></section>}<header className="border-b border-[#edf0f3] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center">{photoUrl ? <img src={photoUrl} alt="" className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-24 sm:w-24" /> : <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#eef8f1] text-3xl font-black text-[#167d3c] sm:h-24 sm:w-24" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>}<div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola provider</p><p className="text-lg font-black text-[#167d3c]">{context ? `${name} can do your job` : "Quickola provider"}</p><h1 className="mt-1 text-3xl font-black">{name}</h1><div className="mt-3 flex flex-wrap gap-2">{profile.provider_status === "approved" && <span className="rounded-full bg-[#eef8f1] px-3 py-1 text-xs font-black text-[#167d3c]">Quickola approved ✓</span>}<span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">New to Quickola</span>{profile.years_experience != null && <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">{profile.years_experience} years experience</span>}{categoryLabels[0] && <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">{categoryLabels[0]}</span>}</div></div></div></header><div className={`${context ? "hidden" : "grid"} grid-cols-2 gap-4 border-b border-[#edf0f3] p-6 sm:grid-cols-3 sm:p-8`}>{profile.years_experience != null && <div><p className="text-2xl font-black">{profile.years_experience}</p><p className="text-sm text-[#526078]">years experience</p></div>}{completedJobs ? <div><p className="text-2xl font-black">{completedJobs}</p><p className="text-sm text-[#526078]">jobs completed</p></div> : null}{categoryLabels[0] && <div><p className="text-2xl font-black">{categoryLabels[0]}</p><p className="text-sm text-[#526078]">services</p></div>}</div><div className="grid gap-8 p-6 sm:p-8">{context && <section><h2 className="text-xl font-black">Why {name} fits your job</h2><ul className="mt-3 grid gap-2 text-sm font-bold text-[#39465b]">{serviceMatch && <li>✓ Offers {context.jobTitle}</li>}{areaMatch && <li>✓ Covers your {context.postcodeDistrict} job</li>}{context.availabilityText && <li>✓ Available: {context.availabilityText}</li>}{profile.years_experience != null && <li>✓ {profile.years_experience} years experience</li>}<li>✓ Quickola approved</li></ul></section>}{context && <section className="rounded-2xl border border-[#dce7df] bg-[#f5fbf6] p-5"><p className="text-xs font-black uppercase tracking-[.14em] text-[#167d3c]">{name}&apos;s quote</p><p className="mt-2 text-3xl font-black">£{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</p>{context.bookingPaid ? <p className="mt-2 font-black text-[#167d3c]">Booked and paid ✓</p> : ["accepted", "selected"].includes(context.quoteStatus) ? <p className="mt-2 font-bold text-[#526078]">This quote has been selected. Continue to payment from your job.</p> : <div className="mt-4 flex flex-wrap gap-3"><MessageAction context={context} name={name} providerId={providerId} />{canChoose && <ChooseAction context={context} name={name} returnTo={returnTo} />}</div>}</section>}{profile.marketplace_bio && <section><h2 className="text-xl font-black">About {name}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#39465b]">{profile.marketplace_bio.trim()}</p></section>}{categoryLabels.length > 0 && <section><h2 className="text-xl font-black">Services</h2>{context ? <><span className="mt-3 inline-flex rounded-full bg-[#dff4e4] px-3 py-2 text-sm font-black text-[#167d3c]">✓ {primaryServiceLabel}</span>{serviceLabels.length > 1 && <details className="mt-3"><summary className="cursor-pointer text-sm font-black text-[#167d3c]">View all services</summary><div className="mt-3 flex flex-wrap gap-2">{serviceLabels.filter((label) => label !== primaryServiceLabel).map((label) => <span key={label} className="rounded-full bg-[#eef8f1] px-3 py-2 text-sm font-bold text-[#167d3c]">{label}</span>)}</div></details>}</> : <div className="mt-3 flex flex-wrap gap-2">{serviceLabels.map((label) => <span key={label} className="rounded-full bg-[#eef8f1] px-3 py-2 text-sm font-bold text-[#167d3c]">{label}</span>)}</div>}</section>}{areaRows.length > 0 && <section><h2 className="text-xl font-black">Areas covered</h2><div className="mt-3 flex flex-wrap gap-2">{areaRows.map((area) => <span key={area.postcode_district} className="rounded-full bg-[#f7f8fa] px-3 py-2 text-sm font-bold">{area.postcode_district}</span>)}</div></section>}</div></article></section>{context && <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#dbe1ea] bg-white/95 p-3 pb-[calc(.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden"><div className="mx-auto flex max-w-3xl items-center justify-between gap-3"><p className="min-w-0 truncate text-sm font-black">{name}&apos;s quote · £{(context.quoteAmount / 100).toFixed(2).replace(/\.00$/, "")}</p><div className="flex shrink-0 gap-2"><MessageAction context={context} name={name} providerId={providerId} />{canChoose && <ChooseAction context={context} name="" returnTo={returnTo} />}</div></div></div>}</main>;
}
