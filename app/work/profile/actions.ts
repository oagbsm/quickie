"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireProviderProfileEditAccess } from "@/lib/marketplace/provider-access";
import { extractMarketplaceServiceAreas, isActiveMarketplacePostcodeDistrict, normaliseMarketplaceServiceAreas } from "@/lib/marketplace/service-areas";

const text = (form: FormData, name: string) => String(form.get(name) || "").trim();

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const profilePhotoTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function logSupabaseFailure(operation: string, error: { code?: string; message?: string; details?: string; hint?: string } | null | undefined, context: { userId?: string; providerId?: string; serviceCount?: number } = {}) {
  if (!error) return;
  console.error("Provider profile operation failed", {
    operation,
    ...context,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

export async function updateProviderProfile(form: FormData) {
  const provider = await requireProviderProfileEditAccess();
  const admin = createSupabaseAdminClient();
  const { data: existingProfile, error: existingProfileError } = await admin
    .from("marketplace_providers")
    .select("display_name,business_name")
    .eq("user_id", provider.providerId)
    .maybeSingle();
  if (existingProfileError || !existingProfile) redirect("/work/profile?error=save");
  const nameLocked = Boolean(existingProfile.display_name?.trim() || existingProfile.business_name?.trim());
  const displayName = text(form, "displayName");
  const businessName = text(form, "businessName");
  const submittedAreas = form.getAll("serviceArea").map(String);
  const areas = normaliseMarketplaceServiceAreas(submittedAreas.length ? submittedAreas : extractMarketplaceServiceAreas(text(form, "serviceAreas")));
  if (areas.some((area) => !isActiveMarketplacePostcodeDistrict(area))) redirect("/work/profile?error=service_area_launch");
  const selectedCategories = new Set(form.getAll("category").map(String));
  const selectedJobValues = new Set(form.getAll("service").map(String));
  const services = marketplaceServices
    .flatMap((service) => service.jobs.filter((job) => job.active && (selectedCategories.has(service.slug) || selectedJobValues.has(`${service.slug}|${job.slug}`))).map((job) => ({ category_slug: service.slug, job_type_slug: job.slug })));
  if ((!nameLocked && (displayName.length < 1 || displayName.length > 120)) || !areas.length || !services.length || text(form, "bio").length > 500)
    redirect("/work/profile?error=required");

  const { data: existing, error: existingServicesError } = await admin
    .from("marketplace_provider_services")
    .select("id,category_slug,job_type_slug,qualification_verified")
    .eq("provider_id", provider.providerId);
  if (existingServicesError) { logSupabaseFailure("read provider services", existingServicesError, { userId: provider.user.id, providerId: provider.providerId, serviceCount: 0 }); redirect("/work/profile?error=save"); }
  const verified = new Map((existing || []).map((item) => [`${item.category_slug}|${item.job_type_slug}`, item.qualification_verified]));
  const phoneColumn = await admin.from("marketplace_providers").select("phone").eq("user_id", provider.providerId).maybeSingle();
  let profilePhotoPath = text(form, "existingPhotoPath") || null;
  const photoAction = text(form, "photoAction");
  if (photoAction === "remove") profilePhotoPath = null;
  const photo = form.get("profilePhoto");
  if (photo instanceof File && photo.size > 0) {
    const extension = profilePhotoTypes.get(photo.type);
    if (!extension || photo.size > MAX_PROFILE_PHOTO_BYTES) redirect("/work/profile?error=photo");
    profilePhotoPath = `${provider.providerId}/profile-${Date.now()}.${extension}`;
    const upload = await admin.storage.from("marketplace-provider-photos").upload(profilePhotoPath, await photo.arrayBuffer(), { contentType: photo.type, upsert: false });
    if (upload.error) { logSupabaseFailure("upload profile photo", upload.error); redirect("/work/profile?error=photo"); }
  }
  const update: Record<string, string | null> = {
    service_area: areas.join(", "),
    marketplace_bio: text(form, "bio") || null,
    profile_photo_url: profilePhotoPath,
    updated_at: new Date().toISOString(),
  };
  if (!phoneColumn.error) update.phone = text(form, "phone") || null;
  if (!nameLocked) {
    update.display_name = displayName;
  }
  update.business_name = businessName || null;
  const profile = await admin.from("marketplace_providers").update(update).eq("user_id", provider.providerId);
  if (profile.error) { logSupabaseFailure("update marketplace_providers", profile.error); redirect("/work/profile?error=save"); }

  const currentAreas = await admin.from("marketplace_provider_service_areas").select("id,postcode_district").eq("provider_id", provider.providerId).eq("active", true);
  if (currentAreas.error) { logSupabaseFailure("read provider service areas", currentAreas.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length }); redirect("/work/profile?error=save"); }
  const areaUpsert = areas.length ? await admin.from("marketplace_provider_service_areas").upsert(areas.map((postcode_district) => ({ provider_id: provider.providerId, postcode_district, active: true })), { onConflict: "provider_id,postcode_district" }) : { error: null };
  if (areaUpsert.error) { logSupabaseFailure("save provider service areas", areaUpsert.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length }); redirect("/work/profile?error=save"); }
  const areaIdsToRemove = (currentAreas.data || []).filter((area) => !areas.includes(area.postcode_district)).map((area) => area.id);
  if (areaIdsToRemove.length) { const removedAreas = await admin.from("marketplace_provider_service_areas").delete().in("id", areaIdsToRemove); if (removedAreas.error) { logSupabaseFailure("remove provider service areas", removedAreas.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length }); redirect("/work/profile?error=save"); } }
  const persistedAreas = await admin.from("marketplace_provider_service_areas").select("postcode_district").eq("provider_id", provider.providerId).eq("active", true);
  const finalAreas = normaliseMarketplaceServiceAreas((persistedAreas.data || []).map((area) => String(area.postcode_district)));
  const areasMatch = !persistedAreas.error && finalAreas.length === areas.length && areas.every((area) => finalAreas.includes(area));
  if (!areasMatch) {
    logSupabaseFailure("verify provider service areas", persistedAreas.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length });
    console.error("Provider service-area persistence mismatch", { userId: provider.user.id, providerId: provider.providerId, submittedAreas: areas, finalPersistedActiveAreaCount: finalAreas.length });
    redirect("/work/profile?error=save");
  }
  const selectedServiceKeys = new Set(services.map((service) => `${service.category_slug}|${service.job_type_slug}`));
  if (services.length) { const serviceUpsert = await admin.from("marketplace_provider_services").upsert(services.map((service) => ({ ...service, provider_id: provider.providerId, active: true, qualification_verified: verified.get(`${service.category_slug}|${service.job_type_slug}`) || false })), { onConflict: "provider_id,job_type_slug" }); if (serviceUpsert.error) { logSupabaseFailure("save provider services", serviceUpsert.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length }); redirect("/work/profile?error=save"); } }
  const removable = (existing || []).filter((item) => !selectedServiceKeys.has(`${item.category_slug}|${item.job_type_slug}`) && !item.qualification_verified).map((item) => item.id);
  if (removable.length) { const removedServices = await admin.from("marketplace_provider_services").delete().eq("provider_id", provider.providerId).in("id", removable); if (removedServices.error) { logSupabaseFailure("remove provider services", removedServices.error, { userId: provider.user.id, providerId: provider.providerId, serviceCount: services.length }); redirect("/work/profile?error=save"); } }
  revalidatePath("/work/profile");
  revalidatePath("/work/onboarding");
  redirect(text(form, "returnTo") === "onboarding" ? "/work/onboarding?step=3&saved=1" : "/work/profile?saved=1");
}
