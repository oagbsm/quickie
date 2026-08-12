import { Suspense } from "react";
import MarketplaceHeader from "../components/marketplace/MarketplaceHeader";
import CustomerAuthForm from "../auth/customer/CustomerAuthForm";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; draft?: string; mode?: string; error?: string; email?: string }> }) {
  await searchParams;
  return <div className="min-h-screen bg-[#f3f6f8]"><MarketplaceHeader/><main id="main-content" className="mx-auto max-w-lg px-5 py-16"><Suspense fallback={<div className="rounded-3xl bg-white p-7 text-center font-bold">Loading sign in…</div>}><CustomerAuthForm/></Suspense></main></div>;
}
