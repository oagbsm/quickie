import { Suspense } from "react";
import MarketplaceHeader from "../components/marketplace/MarketplaceHeader";
import CustomerAuthForm from "../auth/customer/CustomerAuthForm";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalNextPath } from "@/lib/app-url";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string; draft?: string; error?: string }> }) {
  const query = await searchParams;
  const next = safeInternalNextPath(query.next, "/my-jobs");
  const draft = /^[0-9a-f-]{36}$/i.test(query.draft || "") ? query.draft : "";
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    if (draft) redirect(`/auth/customer/publish?draft=${encodeURIComponent(draft)}`);
    const provider = await getMarketplaceProvider();
    if (provider && ["approved", "pending_review"].includes(provider.providerStatus)) redirect("/work");
    if (provider && ["draft", "action_required"].includes(provider.providerStatus)) redirect("/work/onboarding");
    redirect(next);
  }
  return <div className="min-h-screen bg-[#f3f6f8]"><MarketplaceHeader/><main id="main-content" className="mx-auto max-w-lg px-5 py-10 sm:py-16"><Suspense fallback={<div className="rounded-3xl bg-white p-7 text-center font-bold">Loading sign in…</div>}><CustomerAuthForm/></Suspense></main></div>;
}
