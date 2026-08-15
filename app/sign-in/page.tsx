import { Suspense } from "react";
import MarketplaceHeader from "../components/marketplace/MarketplaceHeader";
import CustomerAuthForm from "../auth/customer/CustomerAuthForm";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; draft?: string; mode?: string; error?: string; email?: string }> }) {
  const query = await searchParams;
  if (!query.draft && !query.next && await getApprovedMarketplaceProvider()) redirect("/work");
  return <div className="min-h-screen bg-[#f3f6f8]"><MarketplaceHeader/><main id="main-content" className="mx-auto max-w-lg px-5 py-16"><Suspense fallback={<div className="rounded-3xl bg-white p-7 text-center font-bold">Loading sign in…</div>}><CustomerAuthForm/></Suspense></main></div>;
}
