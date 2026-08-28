import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/app/components/Footer";
import MarketplaceHeader from "@/app/components/marketplace/MarketplaceHeader";
import HomepageHero from "@/app/components/marketplace/HomepageHero";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { getCurrentAccountRole } from "@/lib/auth/account-role";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Quickola | Get Home Jobs Done at a Fair Price", description: "Need something done at home? Tell Quickola what you need once. Local providers send you their prices, so you can compare and choose without ringing around." };
const ideas = [["Clean my 2-bed flat", "cleaning"], ["Cut my lawn", "gardening"], ["Trim my hedge", "gardening"], ["Put up shelves", "handyman"], ["Move a sofa", "removals"], ["Clear old furniture", "waste-removal"]];
const steps = ["Tell us what you need", "Local people send offers", "Choose who you want"];

export default async function Home({ searchParams }: { searchParams?: Promise<Record<string, string | undefined>> }) {
  const query = searchParams ? await searchParams : {};
  if (query.code) {
    const callbackParams = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => { if (value) callbackParams.set(key, value); });
    redirect(`/auth/callback?${callbackParams.toString()}`);
  }
  const role = await getCurrentAccountRole();
  if (role === "admin") redirect("/admin");
  if (role === "provider") {
    const provider = await getMarketplaceProvider();
    redirect(provider?.providerStatus === "approved" || provider?.providerStatus === "pending_review" ? "/work" : "/work/onboarding");
  }
  const error = query.jobError === "validation" ? "Check your job details and postcode." : query.jobError === "persistence" ? "We could not save your job yet. Please try again." : query.jobError === "delivery" ? "We could not send your request. Please try again." : "";
  return <main className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><MarketplaceHeader /><HomepageHero initialService={query.service} initialPostcode={query.postcode} initialLocation={query.location} initialJob={query.job} error={error} /><section className="bg-white px-5 py-12 sm:px-8 sm:py-14"><div className="mx-auto max-w-[1120px]"><p className="text-sm font-black uppercase tracking-[.14em] text-[#23a955]">Popular job ideas</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em]">People use Quickola for jobs like…</h2><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ideas.map(([label, service]) => <Link key={label} href={`/?service=${service}#job-composer`} className="flex min-h-16 items-center rounded-2xl bg-[#f7f8fa] px-5 text-base font-black ring-1 ring-[#e9edf1] focus-visible:ring-4 focus-visible:ring-[#23a955]">{label}</Link>)}</div></div></section><section className="bg-[#061b3f] px-5 py-12 text-white sm:px-8 sm:py-14" id="how-it-works"><div className="mx-auto max-w-[1120px] lg:max-w-[980px]"><p className="text-sm font-black uppercase tracking-[.14em] text-[#23dc63]">HOW QUICKOLA WORKS</p><h2 className="mt-3 text-3xl font-black tracking-[-.05em] sm:text-5xl">Three simple steps</h2><ol className="mt-8 grid gap-4 md:grid-cols-3">{steps.map((title, index) => <li key={title} className="rounded-2xl bg-white/8 p-6 ring-1 ring-white/10"><p className="text-2xl font-black text-[#23dc63]">{index + 1}</p><h3 className="mt-5 text-xl font-black">{title}</h3></li>)}</ol></div></section><Footer /></main>;
}
