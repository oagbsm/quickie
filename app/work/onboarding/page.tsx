import { redirect } from "next/navigation";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateMarketplaceProvider, isProviderBasicProfileComplete, isProviderReadyToSubmit } from "@/lib/marketplace/provider-access";
import { resolveProviderPhotoUrl } from "@/lib/marketplace/provider-photo";
import { refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";
import OnboardingForm from "./OnboardingForm";
import PendingReview from "./PendingReview";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";
import { CURRENT_PROVIDER_PRIVACY_NOTICE_VERSION, recordProviderLegalEvent } from "@/lib/server/provider-legal";

export default async function ProviderOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; payouts?: string; step?: string; submitted?: string; edit?: string; setup?: string }> }) {
  const query = await searchParams;
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  let provider = await getOrCreateMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  if (provider.providerStatus === "approved" && query.edit === "1") redirect("/work/profile?edit=1");
  const providerId = provider.providerId;
  if (["return", "refresh", "checked"].includes(query.payouts || "")) {
    try {
      await refreshProviderPayoutStatus(providerId);
      provider = await getOrCreateMarketplaceProvider();
    } catch (error) {
      console.error("[provider-stripe] return status refresh failed", { providerId, message: error instanceof Error ? error.message : "unknown" });
    }
  }
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  const admin = createSupabaseAdminClient();
  const [{ data: services }, { count: areasCount }] = await Promise.all([
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug,active").eq("provider_id", provider.providerId),
    admin.from("marketplace_provider_service_areas").select("id", { count: "exact", head: true }).eq("provider_id", provider.providerId).eq("active", true),
  ]);
  const photoUrl = await resolveProviderPhotoUrl(admin, String(provider.profile.profile_photo_url || "") || null, 600);
  const initial = { ...provider.profile, email: provider.user.email || "" };
  const initialServices = (services || []).filter((service) => service.active).map((service) => `${service.category_slug}|${service.job_type_slug}`);
  const profileComplete = isProviderReadyToSubmit(provider.profile, (services || []).filter((service) => service.active).length, areasCount || 0, provider.emailConfirmedAt, provider.stripeStatus);
  const basicProfileComplete = isProviderBasicProfileComplete(provider);
  if (provider.providerStatus === "pending_review" || provider.providerStatus === "suspended" || (provider.providerStatus === "approved" && !query.edit && !query.setup && !query.payouts)) {
    if (provider.providerStatus === "approved") redirect("/work/profile#account-readiness");
    return <PendingReview status={provider.providerStatus} stripeStatus={provider.stripeStatus} profileComplete={profileComplete} servicesSelected={initialServices.length > 0} emailVerified={Boolean(provider.emailConfirmedAt)} />;
  }
  const aboutComplete = Boolean((provider.profile.display_name || provider.profile.business_name) && provider.profile.phone && provider.profile.provider_type);
  const servicesComplete = initialServices.length > 0;
  const persistedStep = servicesComplete && aboutComplete ? 3 : aboutComplete ? 2 : 1;
  const requestedStep = Math.min(3, Math.max(1, Number(query.step) || 1));
  const returningFromPayout = ["return", "refresh", "checked"].includes(query.payouts || "");
  const initialStep = returningFromPayout ? 3 : query.step ? requestedStep : persistedStep;
  if (initialStep === 3) {
    try { await recordProviderLegalEvent(providerId, "privacy_notice", CURRENT_PROVIDER_PRIVACY_NOTICE_VERSION, "presented"); } catch (error) { console.error("[provider-legal] privacy notice presentation log failed", { providerId, message: error instanceof Error ? error.message : "unknown" }); }
  }
  const displayError = query.error === "save" && (servicesComplete || returningFromPayout) ? undefined : query.error;
  return <OnboardingForm services={marketplaceServices.map((service) => ({ slug: service.slug, name: service.name, jobs: service.jobs.filter((job) => job.active).map((job) => ({ slug: job.slug, name: job.name })) }))} initial={initial} initialServices={initialServices} readyToSubmit={profileComplete} basicProfileComplete={basicProfileComplete} serviceAreaComplete={Boolean(areasCount)} photoUrl={photoUrl} status={provider.providerStatus} stripeStatus={provider.stripeStatus} emailVerified={Boolean(provider.emailConfirmedAt)} actionReason={String(provider.profile.action_required_reason || "") || null} error={displayError} saved={query.saved} initialStep={initialStep} />;
}
