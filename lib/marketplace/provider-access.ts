import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPostcodeDistrict, isValidUkPostcode, normaliseUkPostcode } from "@/lib/uk-address";

export type ProviderStatus = "draft" | "pending_review" | "approved" | "action_required" | "suspended";
export type ProviderStripeStatus = "not_started" | "onboarding" | "restricted" | "ready";
export type MarketplaceProvider = { user: User; providerId: string; providerStatus: ProviderStatus; stripeStatus: ProviderStripeStatus; stripeAccountId: string | null; profile: Record<string, unknown> };

const providerColumns = "user_id,display_name,business_name,service_area,phone,marketplace_bio,profile_photo_url,provider_status,stripe_status,stripe_account_id,provider_type,base_town,postcode,postcode_area,postcode_district,years_experience,provider_terms_accepted_at,terms_version,submitted_at,approved_at,action_required_reason,suspended_at,availability_days,available_now,marketplace_active";

export async function getMarketplaceProvider(): Promise<MarketplaceProvider | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const { data: profile, error } = await admin.from("cleaner_profiles").select(providerColumns).eq("user_id", user.id).maybeSingle();
  if (error || !profile) return null;
  return { user, providerId: profile.user_id, providerStatus: (profile.provider_status || "draft") as ProviderStatus, stripeStatus: (profile.stripe_status || "not_started") as ProviderStripeStatus, stripeAccountId: profile.stripe_account_id || null, profile: profile as Record<string, unknown> };
}

export async function getOrCreateMarketplaceProvider() {
  const existing = await getMarketplaceProvider();
  if (existing) return existing;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createSupabaseAdminClient();
  const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim();
  const { error } = await admin.from("cleaner_profiles").upsert({ user_id: user.id, display_name: displayName || "Provider", role: "cleaner", provider_status: "draft", stripe_status: "not_started", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return null;
  return getMarketplaceProvider();
}

export function isStripeReady(provider: Pick<MarketplaceProvider, "stripeStatus"> | { stripe_status?: string | null }) { return ("stripeStatus" in provider ? provider.stripeStatus : provider.stripe_status) === "ready"; }
export function canProviderOperate(provider: Pick<MarketplaceProvider, "providerStatus" | "stripeStatus"> | { provider_status?: string | null; stripe_status?: string | null }) { const providerStatus = "providerStatus" in provider ? provider.providerStatus : provider.provider_status; const stripeStatus = "stripeStatus" in provider ? provider.stripeStatus : provider.stripe_status; return providerStatus === "approved" && stripeStatus === "ready"; }
export function isProviderProfileComplete(profile: Record<string, unknown>, servicesCount: number, areasCount: number) { const name = String(profile.display_name || profile.business_name || "").trim(); const phone = String(profile.phone || "").trim(); const postcode = String(profile.postcode || "").trim(); return Boolean(name && profile.profile_photo_url && phone && profile.marketplace_bio && profile.provider_type && profile.base_town && isValidUkPostcode(postcode) && servicesCount > 0 && areasCount > 0 && profile.provider_terms_accepted_at); }
export function providerCoversJob(serviceAreas: Array<{ postcode_district?: string | null }> | string[], jobPostcodeOrDistrict: string) { const district = getPostcodeDistrict(jobPostcodeOrDistrict) || jobPostcodeOrDistrict.trim().toUpperCase(); return serviceAreas.some((area) => { const value = typeof area === "string" ? area : area.postcode_district || ""; return value.trim().toUpperCase() === district; }); }
export function providerOffersService(services: Array<{ category_slug?: string | null; job_type_slug?: string | null }>, category: string, jobType: string) { return services.some((service) => service.category_slug === category && service.job_type_slug === jobType); }
export function normaliseProviderPostcode(value: string) { const postcode = normaliseUkPostcode(value); return { postcode, district: getPostcodeDistrict(postcode) }; }
export async function getApprovedMarketplaceProvider() { const provider = await getMarketplaceProvider(); return provider && provider.providerStatus === "approved" ? provider : null; }
export async function getOperationalMarketplaceProvider() { const provider = await getMarketplaceProvider(); return provider && canProviderOperate(provider) ? provider : null; }
export async function getSignedInUser() { const supabase = await createSupabaseServerClient(); return (await supabase.auth.getUser()).data.user; }
