import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostcodeDistrict, normaliseUkPostcode } from "@/lib/uk-address";
import { destinationForAccount, getCurrentAccountContext, getCurrentAccountRole } from "@/lib/auth/account-role";

export type ProviderStatus = "draft" | "pending_review" | "approved" | "action_required" | "suspended";
export type ProviderStripeStatus = "not_started" | "onboarding" | "restricted" | "verification_pending" | "ready";
export type MarketplaceProvider = { user: User; providerId: string; providerStatus: ProviderStatus; stripeStatus: ProviderStripeStatus; stripeAccountId: string | null; emailConfirmedAt: string | null; profile: Record<string, unknown> };

const providerColumns = "user_id,display_name,business_name,service_area,phone,marketplace_bio,profile_photo_url,provider_status,stripe_status,stripe_account_id,provider_type,base_town,postcode,postcode_area,postcode_district,years_experience,provider_terms_accepted_at,terms_version,submitted_at,approved_at,action_required_reason,suspended_at,availability_days,available_now,marketplace_active";

export async function getMarketplaceProvider(): Promise<MarketplaceProvider | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  if (await getCurrentAccountRole() !== "provider") return null;
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("marketplace_providers").select(providerColumns).eq("user_id", user.id).maybeSingle();
  if (error || !profile) return null;
  return { user, providerId: profile.user_id, providerStatus: (profile.provider_status || "draft") as ProviderStatus, stripeStatus: (profile.stripe_status || "not_started") as ProviderStripeStatus, stripeAccountId: profile.stripe_account_id || null, emailConfirmedAt: user.email_confirmed_at || user.confirmed_at || null, profile: profile as Record<string, unknown> };
}

export async function getOrCreateMarketplaceProvider() {
  const role = await getCurrentAccountRole();
  if (role === "admin" || role === "customer") return null;
  const existing = await getMarketplaceProvider();
  if (existing) return existing;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
  const { error } = await admin.from("marketplace_providers").upsert({ user_id: user.id, display_name: displayName || "Provider", provider_status: "draft", stripe_status: "not_started", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return null;
  return getMarketplaceProvider();
}

export function isStripeReady(provider: Pick<MarketplaceProvider, "stripeStatus"> | { stripe_status?: string | null }) { return ("stripeStatus" in provider ? provider.stripeStatus : provider.stripe_status) === "ready"; }
export function canProviderOperate(provider: Pick<MarketplaceProvider, "providerStatus" | "stripeStatus"> | { provider_status?: string | null; stripe_status?: string | null; marketplace_active?: boolean | null; emailConfirmedAt?: string | null; profile?: Record<string, unknown> }) { const providerStatus = "providerStatus" in provider ? provider.providerStatus : provider.provider_status; const stripeStatus = "stripeStatus" in provider ? provider.stripeStatus : provider.stripe_status; const marketplaceActive = "profile" in provider ? provider.profile?.marketplace_active : "marketplace_active" in provider ? provider.marketplace_active : undefined; return providerStatus === "approved" && stripeStatus === "ready" && marketplaceActive !== false && (!("emailConfirmedAt" in provider) || Boolean(provider.emailConfirmedAt)); }
export function isProviderBasicProfileComplete(provider: MarketplaceProvider) { const profile = provider.profile; return Boolean((profile.display_name || profile.business_name) && profile.phone && profile.provider_type); }
export function isProviderReadyToSubmit(profile: Record<string, unknown>, servicesCount: number, areasCount: number, emailConfirmedAt: string | null | undefined, stripeStatus: string | null | undefined) { const name = String(profile.display_name || profile.business_name || "").trim(); const phone = String(profile.phone || "").trim(); return Boolean(name && phone && profile.provider_type && profile.base_town && profile.profile_photo_url && profile.provider_terms_accepted_at && servicesCount > 0 && areasCount > 0 && emailConfirmedAt && stripeStatus === "ready"); }
export function canProviderBrowseJobs(provider: MarketplaceProvider, servicesCount: number) { return provider.providerStatus !== "suspended" && Boolean(provider.emailConfirmedAt) && isProviderBasicProfileComplete(provider) && servicesCount > 0; }
export function isProviderProfileComplete(profile: Record<string, unknown>, servicesCount: number, areasCount: number) { const name = String(profile.display_name || profile.business_name || "").trim(); const phone = String(profile.phone || "").trim(); return Boolean(name && profile.profile_photo_url && phone && profile.marketplace_bio && profile.provider_type && profile.base_town && servicesCount > 0 && areasCount > 0 && profile.provider_terms_accepted_at); }
export function providerCoversJob(serviceAreas: Array<{ postcode_district?: string | null }> | string[], jobPostcodeOrDistrict: string) { const district = getPostcodeDistrict(jobPostcodeOrDistrict) || jobPostcodeOrDistrict.trim().toUpperCase(); return serviceAreas.some((area) => { const value = typeof area === "string" ? area : area.postcode_district || ""; return value.trim().toUpperCase() === district; }); }
export function providerOffersService(services: Array<{ category_slug?: string | null; job_type_slug?: string | null }>, category: string, jobType: string) { return services.some((service) => service.category_slug === category && service.job_type_slug === jobType); }
export function normaliseProviderPostcode(value: string) { const postcode = normaliseUkPostcode(value); return { postcode, district: getPostcodeDistrict(postcode) }; }
export async function getApprovedMarketplaceProvider() { const provider = await getMarketplaceProvider(); return provider && provider.providerStatus === "approved" ? provider : null; }
export async function getOperationalMarketplaceProvider() { const provider = await getMarketplaceProvider(); return provider && canProviderOperate(provider) ? provider : null; }
export async function getSignedInUser() { const supabase = await createSupabaseServerClient(); return (await supabase.auth.getUser()).data.user; }

export async function requireProviderWorkspaceAccess() {
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  const provider = await getMarketplaceProvider();
  if (!provider) {
    const user = await getSignedInUser();
    redirect(user ? "/pro/login?error=not-approved" : "/pro/login");
  }
  if (provider.providerStatus === "pending_review") redirect("/work");
  if (provider.providerStatus === "suspended") redirect("/work");
  if (provider.providerStatus !== "approved") redirect("/work/onboarding");
  return provider;
}

/** Server-side gate for actions that can create quotes or marketplace work. */
export async function requireProviderOperationalAccess() {
  const provider = await requireProviderWorkspaceAccess();
  if (!canProviderOperate(provider)) return null;
  return provider;
}

export async function requireProviderBrowseAccess() {
  const account = await getCurrentAccountContext();
  if (account.role !== "provider") redirect(destinationForAccount(account) || "/");
  const provider = await getMarketplaceProvider();
  if (!provider) {
    const user = await getSignedInUser();
    redirect(user ? "/pro/login?error=not-approved" : "/pro/login");
  }
  const admin = createSupabaseAdminClient();
  const { count } = await admin.from("marketplace_provider_services").select("id", { count: "exact", head: true }).eq("provider_id", provider.providerId).eq("active", true);
  if (!canProviderBrowseJobs(provider, count || 0)) redirect("/work/onboarding");
  return provider;
}

export function missingProviderQuoteRequirements(provider: MarketplaceProvider, servicesCount: number) {
  const missing: string[] = [];
  if (!isProviderBasicProfileComplete(provider)) missing.push("basic profile");
  if (!provider.profile.profile_photo_url) missing.push("profile photo");
  if (!provider.profile.provider_terms_accepted_at) missing.push("provider terms");
  if (!provider.emailConfirmedAt) missing.push("confirmed email");
  if (!servicesCount) missing.push("service selection");
  if (provider.providerStatus !== "approved") missing.push(provider.providerStatus === "pending_review" ? "Quickola approval" : "Quickola review");
  if (provider.stripeStatus !== "ready") missing.push("payout setup");
  return missing;
}
