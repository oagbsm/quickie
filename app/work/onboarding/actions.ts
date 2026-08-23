"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMarketplaceProvider, isProviderProfileComplete, normaliseProviderPostcode } from "@/lib/marketplace/provider-access";
import { marketplaceServices } from "@/app/data/marketplace";
import { isValidUkPostcode } from "@/lib/uk-address";
import { createProviderPayoutLink, refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";
import { describeStripeError } from "@/lib/server/marketplace-payments";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const areaPattern = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/;

function text(form: FormData, key: string) { return String(form.get(key) || "").trim(); }
function safeAreas(form: FormData) { return [...new Set(form.getAll("serviceArea").map(String).map((value) => value.trim().toUpperCase()).filter((value) => areaPattern.test(value)))]; }
function selectedServices(form: FormData) {
  const allowed = new Set(marketplaceServices.flatMap((service) => service.jobs.map((job) => `${service.slug}|${job.slug}`)));
  return [...new Set(form.getAll("service").map(String).filter((value) => allowed.has(value)))].map((value) => { const [category_slug, job_type_slug] = value.split("|"); return { category_slug, job_type_slug }; });
}

export async function saveProviderOnboarding(formData: FormData) {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  const admin = createSupabaseAdminClient();
  const displayName = text(formData, "displayName") || String(provider.profile.display_name || "");
  const businessName = text(formData, "businessName") || String(provider.profile.business_name || "");
  const phone = text(formData, "phone") || String(provider.profile.phone || "");
  const bio = text(formData, "bio") || String(provider.profile.marketplace_bio || "");
  const providerType = text(formData, "providerType") || String(provider.profile.provider_type || "individual");
  const baseTown = text(formData, "baseTown") || String(provider.profile.base_town || "");
  const rawPostcode = text(formData, "postcode") || String(provider.profile.postcode || "");
  const services = selectedServices(formData);
  const areas = safeAreas(formData);
  const termsAccepted = formData.get("termsAccepted") === "on";
  if ((displayName && (displayName.length < 2 || displayName.length > 120)) || (phone && !/^\+?[0-9 ()-]{9,20}$/.test(phone)) || bio.length > 500 || (providerType && !["individual", "business"].includes(providerType)) || (baseTown && baseTown.length < 2) || (rawPostcode && !isValidUkPostcode(rawPostcode))) redirect("/work/onboarding?error=required");
  const { postcode, district } = normaliseProviderPostcode(rawPostcode);
  const area = district.match(/^[A-Z]+/)?.[0] || "";
  let photoPath = String(formData.get("existingPhotoPath") || "").trim() || String(provider.profile.profile_photo_url || "");
  const photo = formData.get("profilePhoto");
  if (photo instanceof File && photo.size > 0) {
    if (!allowedPhotoTypes.has(photo.type) || photo.size > MAX_PHOTO_BYTES) redirect("/work/onboarding?error=photo");
    photoPath = `${provider.providerId}/${randomUUID()}`;
    const upload = await admin.storage.from("marketplace-provider-photos").upload(photoPath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
    if (upload.error) redirect("/work/onboarding?error=photo");
  }
  const availabilityDays = formData.has("availabilityDayField") ? formData.getAll("availabilityDay").map(String) : provider.profile.availability_days || [];
  const profileUpdate = await admin.from("cleaner_profiles").update({ display_name: displayName || "Provider", business_name: businessName || null, phone: phone || null, marketplace_bio: bio || null, provider_type: providerType || null, base_town: baseTown || null, postcode, postcode_area: area || null, postcode_district: district || null, years_experience: Number(text(formData, "yearsExperience")) || Number(provider.profile.years_experience) || null, profile_photo_url: photoPath || null, availability_days: availabilityDays, available_now: formData.has("availableNowField") ? formData.getAll("availableNow").map(String).includes("on") : provider.profile.available_now !== false, ...(termsAccepted ? { provider_terms_accepted_at: new Date().toISOString(), terms_version: "provider-2026-08" } : {}), updated_at: new Date().toISOString() }).eq("user_id", provider.providerId);
  if (profileUpdate.error) redirect("/work/onboarding?error=save");
  const previousPhotoPath = String(provider.profile.profile_photo_url || "").trim();
  if (photoPath && previousPhotoPath && photoPath !== previousPhotoPath && !previousPhotoPath.startsWith("http")) {
    await admin.storage.from("marketplace-provider-photos").remove([previousPhotoPath]);
  }
  await admin.from("marketplace_provider_services").delete().eq("provider_id", provider.providerId);
  const serviceInsert = await admin.from("marketplace_provider_services").insert(services.map((service) => ({ ...service, provider_id: provider.providerId, active: true, qualification_verified: false })));
  if (serviceInsert.error) redirect("/work/onboarding?error=save");
  await admin.from("marketplace_provider_service_areas").delete().eq("provider_id", provider.providerId);
  const areasInsert = await admin.from("marketplace_provider_service_areas").insert(areas.map((postcode_district) => ({ provider_id: provider.providerId, postcode_district, active: true })));
  if (areasInsert.error) redirect("/work/onboarding?error=save");
  revalidatePath("/work"); revalidatePath("/work/profile"); revalidatePath("/work/onboarding");
  redirect("/work/onboarding?saved=1");
}

export async function submitProviderApplication() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  const admin = createSupabaseAdminClient();
  const [profileResult, servicesResult, areasResult] = await Promise.all([
    admin.from("cleaner_profiles").select("*").eq("user_id", provider.providerId).single(),
    admin.from("marketplace_provider_services").select("id").eq("provider_id", provider.providerId).eq("active", true),
    admin.from("marketplace_provider_service_areas").select("id").eq("provider_id", provider.providerId).eq("active", true),
  ]);
  if (!provider.emailConfirmedAt) redirect("/work/onboarding?error=email_unverified");
  if (profileResult.error || !isProviderProfileComplete(profileResult.data || {}, servicesResult.data?.length || 0, areasResult.data?.length || 0)) redirect("/work/onboarding?error=incomplete");
  if (profileResult.data.provider_status === "suspended") redirect("/work/onboarding?error=suspended");
  const update = await admin.from("cleaner_profiles").update({ provider_status: "pending_review", submitted_at: new Date().toISOString(), action_required_reason: null, updated_at: new Date().toISOString() }).eq("user_id", provider.providerId).in("provider_status", ["draft", "action_required"]);
  if (update.error) redirect("/work/onboarding?error=submit");
  await admin.from("marketplace_provider_status_history").insert({ provider_id: provider.providerId, from_status: provider.providerStatus, to_status: "pending_review", changed_by: provider.user.id });
  revalidatePath("/work"); revalidatePath("/work/onboarding"); revalidatePath("/admin/providers");
  redirect("/work?submitted=1");
}

export async function startProviderPayoutSetup() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  let url = "";
  try {
    url = await createProviderPayoutLink(provider.providerId);
  } catch (error) {
    console.error("[provider-stripe] setup start failed", { providerId: provider.providerId, ...describeStripeError(error) });
    redirect("/work/onboarding?error=stripe");
  }
  redirect(url);
}

export async function refreshProviderPayoutSetup() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  try { await refreshProviderPayoutStatus(provider.providerId); } catch (error) { console.error("[provider-stripe] status refresh failed", { providerId: provider.providerId, message: error instanceof Error ? error.message : "unknown" }); }
  revalidatePath("/work/onboarding"); revalidatePath("/work");
  redirect("/work/onboarding?payouts=checked");
}
