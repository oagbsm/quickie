import Link from "next/link";
import { notFound } from "next/navigation";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function PublicProviderProfile({ params }: { params: Promise<{ providerId: string }> }) {
  const { providerId } = await params;
  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { data: services }, { data: areas }, { data: reviews }, { count: completedJobs }] = await Promise.all([
    admin.from("cleaner_profiles").select("user_id,display_name,business_name,marketplace_bio,profile_photo_url,years_experience,provider_status").eq("user_id", providerId).eq("provider_status", "approved").maybeSingle(),
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug").eq("provider_id", providerId).eq("active", true),
    admin.from("marketplace_provider_service_areas").select("postcode_district").eq("provider_id", providerId).eq("active", true).order("postcode_district"),
    admin.from("marketplace_reviews").select("rating,review_text,created_at").eq("provider_id", providerId).order("created_at", { ascending: false }).limit(10),
    admin.from("marketplace_bookings").select("id", { count: "exact", head: true }).eq("provider_id", providerId).eq("status", "completed"),
  ]);
  if (!profile) notFound();
  const photoUrl = profile.profile_photo_url ? (await admin.storage.from("marketplace-provider-photos").createSignedUrl(profile.profile_photo_url, 3600)).data?.signedUrl : null;
  const serviceLabels = (services || []).map((item) => {
    const category = marketplaceServices.find((service) => service.slug === item.category_slug);
    const job = category?.jobs.find((candidate) => candidate.slug === item.job_type_slug);
    return job?.name || category?.name || item.job_type_slug.replaceAll("-", " ");
  });
  const categoryLabels = [...new Set((services || []).map((item) => marketplaceServices.find((service) => service.slug === item.category_slug)?.name || item.category_slug.replaceAll("-", " ")))];
  const areaRows = areas || [];
  const reviewRows = reviews || [];
  const averageRating = reviewRows.length ? reviewRows.reduce((sum, review) => sum + Number(review.rating), 0) / reviewRows.length : null;
  const name = profile.business_name || profile.display_name || "Quickola provider";
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><section className="mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12"><Link href="/messages" className="text-sm font-black text-[#167d3c]">← Back</Link><article className="mt-5 overflow-hidden rounded-3xl border border-[#e7ebef] bg-white"><header className="border-b border-[#edf0f3] p-6 sm:p-8"><div className="flex flex-wrap items-center gap-5">{photoUrl ? <img src={photoUrl} alt="" className="h-24 w-24 rounded-2xl object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#eef8f1] text-3xl font-black text-[#167d3c]" aria-hidden="true">{name.slice(0, 1).toUpperCase()}</div>}<div><p className="text-xs font-black uppercase tracking-[.14em] text-[#159548]">Quickola provider</p><h1 className="mt-2 text-3xl font-black">{name}</h1><div className="mt-3 flex flex-wrap gap-2">{profile.provider_status === "approved" && <span className="rounded-full bg-[#eef8f1] px-3 py-1 text-xs font-black text-[#167d3c]">Quickola approved ✓</span>}{reviewRows.length > 0 && <span className="rounded-full bg-[#f7f8fa] px-3 py-1 text-xs font-black">{averageRating?.toFixed(1)} ★ · {reviewRows.length} review{reviewRows.length === 1 ? "" : "s"}</span>}</div></div></div></header><div className="grid gap-7 p-6 sm:p-8">{categoryLabels.length > 0 && <section><h2 className="text-xl font-black">Services offered</h2><p className="mt-3 leading-7 text-[#39465b]">{categoryLabels.join(" · ")}</p>{serviceLabels.length > 0 && <p className="mt-2 text-sm leading-6 text-[#657089]">{serviceLabels.join(" · ")}</p>}</section>}{areaRows.length > 0 && <section><h2 className="text-xl font-black">Service areas</h2><p className="mt-3 leading-7 text-[#39465b]">{areaRows.map((area) => area.postcode_district).join(" · ")}</p></section>}{profile.marketplace_bio && <section><h2 className="text-xl font-black">About</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-[#39465b]">{profile.marketplace_bio}</p></section>}{profile.years_experience != null && <section><h2 className="text-xl font-black">Experience</h2><p className="mt-3 text-[#39465b]">{profile.years_experience} years of experience</p></section>}{reviewRows.length > 0 ? <section><h2 className="text-xl font-black">Reviews</h2><div className="mt-3 grid gap-3">{reviewRows.map((review) => <article key={`${review.created_at}-${review.rating}`} className="rounded-2xl bg-[#f7f8fa] p-4"><p className="font-black">{"★".repeat(Number(review.rating))}</p>{review.review_text && <p className="mt-2 leading-6 text-[#39465b]">{review.review_text}</p>}</article>)}</div></section> : <section><h2 className="text-xl font-black">Reviews</h2><p className="mt-3 text-[#657089]">New to Quickola</p></section>}{completedJobs ? <p className="font-black text-[#167d3c]">{completedJobs} job{completedJobs === 1 ? "" : "s"} completed</p> : null}</div></article></section></main>;
}
