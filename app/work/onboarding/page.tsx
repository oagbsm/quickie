import { redirect } from "next/navigation";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateMarketplaceProvider, isProviderProfileComplete } from "@/lib/marketplace/provider-access";
import { refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";
import OnboardingForm from "./OnboardingForm";
import PendingReview from "./PendingReview";
import { destinationForAccount, getCurrentAccountContext } from "@/lib/auth/account-role";

export default async function ProviderOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; payouts?: string; step?: string; submitted?: string; edit?: string; setup?: string }> }) {
  const query = await searchParams;
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  let provider = await getOrCreateMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  const providerId = provider.providerId;
  if (["return", "refresh"].includes(query.payouts || "")) {
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
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug,active,qualification_verified").eq("provider_id", provider.providerId),
    admin.from("marketplace_provider_service_areas").select("id", { count: "exact", head: true }).eq("provider_id", provider.providerId).eq("active", true),
  ]);
  const photoPath = String(provider.profile.profile_photo_url || "");
  const photoUrl = photoPath.startsWith("http") ? photoPath : photoPath ? (await admin.storage.from("marketplace-provider-photos").createSignedUrl(photoPath, 600)).data?.signedUrl || null : null;
  const initial = { ...provider.profile, email: provider.user.email || "" };
  const initialServices = (services || []).filter((service) => service.active).map((service) => `${service.category_slug}|${service.job_type_slug}`);
  const qualificationMissing = (services || []).some((service) => service.active && ["plumbing", "electrical", "smart-home"].includes(service.category_slug) && !service.qualification_verified);
  const profileComplete = isProviderProfileComplete(provider.profile, (services || []).filter((service) => service.active).length, areasCount || 0);
  if (provider.providerStatus === "pending_review" || provider.providerStatus === "approved" || provider.providerStatus === "suspended") {
    return <PendingReview status={provider.providerStatus} stripeStatus={provider.stripeStatus} profileComplete={profileComplete} servicesSelected={initialServices.length > 0} qualificationMissing={qualificationMissing} emailVerified={Boolean(provider.emailConfirmedAt)} />;
  }
  const aboutComplete = Boolean((provider.profile.display_name || provider.profile.business_name) && provider.profile.phone && provider.profile.provider_type);
  const servicesComplete = initialServices.length > 0;
  const persistedStep = servicesComplete && aboutComplete ? 3 : aboutComplete ? 2 : 1;
  const requestedStep = Math.min(3, Math.max(1, Number(query.step) || 1));
  const returningFromPayout = ["return", "refresh", "checked"].includes(query.payouts || "");
  const initialStep = returningFromPayout ? 3 : query.step ? requestedStep : persistedStep;
  return <OnboardingForm services={marketplaceServices.map((service) => ({ slug: service.slug, name: service.name, jobs: service.jobs.filter((job) => job.active).map((job) => ({ slug: job.slug, name: job.name })) }))} initial={initial} initialServices={initialServices} qualificationMissing={qualificationMissing} profileComplete={profileComplete} photoUrl={photoUrl} status={provider.providerStatus} stripeStatus={provider.stripeStatus} emailVerified={Boolean(provider.emailConfirmedAt)} actionReason={String(provider.profile.action_required_reason || "") || null} error={query.error} saved={query.saved} payouts={query.payouts} initialStep={initialStep} />;
}
