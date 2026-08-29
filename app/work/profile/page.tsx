import { redirect } from "next/navigation";
import { getMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { startProviderPayoutSetup } from "@/app/work/onboarding/actions";
import { refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";

export default async function ProviderProfilePage({ searchParams }: { searchParams: Promise<{ payouts?: string; saved?: string; error?: string }> }) {
  const query = await searchParams;
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  let provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login");
  if (["pending_review", "suspended"].includes(provider.providerStatus)) redirect("/work");
  if (["return", "refresh"].includes(query.payouts || "")) {
    try {
      await refreshProviderPayoutStatus(provider.providerId);
      provider = await getMarketplaceProvider();
    } catch {
      // Keep the existing status visible if Stripe is temporarily unavailable.
    }
  }
  if (!provider) redirect("/pro/login");
  const admin = createSupabaseAdminClient();
  const { data: services } = await admin.from("marketplace_provider_services").select("category_slug,job_type_slug,qualification_verified,active").eq("provider_id", provider.providerId).eq("active", true).order("category_slug");
  const regulated = (services || []).filter((service) => ["plumbing", "electrical", "smart-home"].includes(service.category_slug));
  const missingQualifications = regulated.filter((service) => !service.qualification_verified);
  const setupError = query.error === "provider_email_missing" ? "Verify your email before setting up payouts." : query.error ? "We couldn’t update your account readiness. Please try again." : "";
  return <main id="account-readiness" className="min-h-screen bg-[#f7f8fa] text-[#061b3f]"><header className="border-b border-[#e7ebef] bg-white"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8"><h1 className="text-xl font-black">Quickola</h1><a href="/work" className="text-sm font-black text-[#167d3c]">Back to workspace</a></div></header><section className="mx-auto max-w-3xl px-5 py-8 sm:px-8"><p className="text-xs font-black uppercase tracking-[.15em] text-[#159548]">PROVIDER PROFILE</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-4xl font-black tracking-[-.05em]">Your profile</h2><p className="mt-2 text-[#657089]">Your application is approved. Keep these account requirements up to date before quoting.</p></div><a href="/work/onboarding?edit=1" className="min-h-11 rounded-xl border border-[#dbe1ea] px-4 py-3 text-sm font-black">Edit profile</a></div>{(setupError || query.saved || query.payouts) && <p className="mt-5 rounded-xl bg-[#fff8e8] p-3 text-sm font-bold text-[#8a5a00]">{setupError || (query.saved ? "Your provider profile has been saved." : "Payout status refreshed.")}</p>}<section className="mt-7 rounded-3xl border border-[#e7ebef] bg-white p-6 sm:p-7"><div className="flex items-center justify-between gap-4"><h3 className="text-2xl font-black">Account readiness</h3><span className="rounded-full bg-[#eef8f1] px-3 py-2 text-sm font-black text-[#167d3c]">Approved ✓</span></div><div className="mt-6 grid gap-4"><div className="rounded-2xl border border-[#e7ebef] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">Payouts</p><p className="mt-1 text-sm text-[#657089]">{provider.stripeStatus === "ready" ? "Your payout setup is ready." : "Complete Stripe verification so you can receive payments."}</p></div><span className={`rounded-full px-3 py-1 text-sm font-black ${provider.stripeStatus === "ready" ? "bg-[#eef8f1] text-[#167d3c]" : "bg-[#fff8e8] text-[#8a5a00]"}`}>{provider.stripeStatus === "ready" ? "Ready ✓" : "Action required"}</span></div>{provider.stripeStatus !== "ready" && <form action={startProviderPayoutSetup} className="mt-4"><input type="hidden" name="returnPath" value="/work/profile" /><button className="min-h-11 rounded-xl bg-[#23a955] px-4 font-black text-[#061b3f]">Continue payout setup</button></form>}</div><div className="rounded-2xl border border-[#e7ebef] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">Service requirements</p><p className="mt-1 text-sm text-[#657089]">{missingQualifications.length ? "Complete the required checks before quoting for regulated services." : "All selected service checks are ready."}</p></div><span className={`rounded-full px-3 py-1 text-sm font-black ${missingQualifications.length ? "bg-[#fff8e8] text-[#8a5a00]" : "bg-[#eef8f1] text-[#167d3c]"}`}>{missingQualifications.length ? "Action required" : "Ready ✓"}</span></div>{missingQualifications.length > 0 && <><p className="mt-4 text-sm font-bold text-[#6c5530]">Checks needed for: {[...new Set(missingQualifications.map((service) => service.category_slug))].join(", ")}</p><p className="mt-2 text-sm text-[#657089]">Contact Quickola to complete these service checks.</p></>}</div></div></section></section></main>;
}
