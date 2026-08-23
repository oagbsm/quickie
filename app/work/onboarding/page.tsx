import { redirect } from "next/navigation";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getOrCreateMarketplaceProvider } from "@/lib/marketplace/provider-access";
import { refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";
import OnboardingForm from "./OnboardingForm";

export default async function ProviderOnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; payouts?: string; step?: string; submitted?: string; edit?: string }> }) {
  const query = await searchParams;
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
  if (provider.providerStatus === "pending_review") redirect("/work");
  if (provider.providerStatus === "approved" && query.edit !== "1") redirect("/work");
  const admin = createSupabaseAdminClient();
  const [{ data: services }, { data: areas }] = await Promise.all([
    admin.from("marketplace_provider_services").select("category_slug,job_type_slug,active").eq("provider_id", provider.providerId),
    admin.from("marketplace_provider_service_areas").select("postcode_district,active").eq("provider_id", provider.providerId),
  ]);
  const photoPath = String(provider.profile.profile_photo_url || "");
  const photoUrl = photoPath.startsWith("http") ? photoPath : photoPath ? (await admin.storage.from("marketplace-provider-photos").createSignedUrl(photoPath, 600)).data?.signedUrl || null : null;
  const initial = { ...provider.profile, email: provider.user.email || "" };
  const initialServices = (services || []).filter((service) => service.active).map((service) => `${service.category_slug}|${service.job_type_slug}`);
  const initialAreas = (areas || []).filter((area) => area.active).map((area) => area.postcode_district).concat(String(provider.profile.service_area || "").toUpperCase().match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\b/g) || []);
  const aboutComplete = Boolean(provider.profile.display_name && provider.profile.phone && (provider.profile.profile_photo_url || photoUrl));
  const servicesComplete = initialServices.length > 0;
  const areasComplete = Boolean(provider.profile.base_town) && initialAreas.length > 0;
  const trustComplete = Boolean(provider.profile.marketplace_bio && provider.profile.provider_terms_accepted_at);
  const payoutsComplete = provider.stripeStatus === "ready" || provider.stripeStatus === "verification_pending";
  const persistedStep = payoutsComplete && trustComplete ? 6 : trustComplete ? 5 : areasComplete ? 4 : servicesComplete ? 3 : aboutComplete ? 2 : 1;
  const requestedStep = Math.min(6, Math.max(1, Number(query.step) || 1));
  const returningFromPayout = ["return", "refresh", "checked"].includes(query.payouts || "");
  const initialStep = returningFromPayout ? (payoutsComplete && trustComplete ? 6 : 5) : query.step ? requestedStep : persistedStep;
  return <OnboardingForm services={marketplaceServices.map((service) => ({ slug: service.slug, name: service.name, jobs: service.jobs.filter((job) => job.active).map((job) => ({ slug: job.slug, name: job.name })) }))} initial={initial} initialServices={initialServices} initialAreas={initialAreas} photoUrl={photoUrl} status={provider.providerStatus} stripeStatus={provider.stripeStatus} emailVerified={Boolean(provider.emailConfirmedAt)} actionReason={String(provider.profile.action_required_reason || "") || null} error={query.error || (returningFromPayout && !payoutsComplete ? "payout_incomplete" : undefined)} saved={query.saved} payouts={query.payouts} initialStep={initialStep} />;
}
