"use server";

import { redirect } from "next/navigation";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireProviderWorkspaceAccess } from "@/lib/marketplace/provider-access";

const text = (form: FormData, name: string) => String(form.get(name) || "").trim();

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const profilePhotoTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function logSupabaseFailure(operation: string, error: { code?: string; message?: string; details?: string; hint?: string } | null | undefined) {
  if (!error) return;
  console.error("Provider profile operation failed", {
    operation,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function postcodeDistricts(value: string) {
  return [...new Set((value.toUpperCase().match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\b/g) || []).filter((area) => /^SL[1-9]$/.test(area)))];
}

export async function updateProviderProfile(form: FormData) {
  const provider = await requireProviderWorkspaceAccess();
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
  const areas = postcodeDistricts(form.getAll("serviceArea").map(String).join(" ") || text(form, "serviceAreas"));
  const selectedCategories = new Set(form.getAll("category").map(String));
  const services = marketplaceServices
    .filter((service) => selectedCategories.has(service.slug))
    .flatMap((service) => service.jobs.filter((job) => job.active).map((job) => ({ category_slug: service.slug, job_type_slug: job.slug })));
  if ((!nameLocked && (displayName.length < 1 || displayName.length > 120)) || !areas.length || !services.length || text(form, "bio").length > 500)
    redirect("/work/profile?error=required");

  const { data: existing } = await admin
    .from("marketplace_provider_services")
    .select("job_type_slug,qualification_verified")
    .eq("provider_id", provider.providerId);
  const verified = new Map((existing || []).map((item) => [item.job_type_slug, item.qualification_verified]));
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

  const currentAreas = await admin.from("marketplace_provider_service_areas").select("id,postcode_district").eq("provider_id", provider.providerId);
  if (currentAreas.error) { logSupabaseFailure("read provider service areas", currentAreas.error); redirect("/work/profile?error=save"); }
  const areaUpsert = areas.length ? await admin.from("marketplace_provider_service_areas").upsert(areas.map((postcode_district) => ({ provider_id: provider.providerId, postcode_district, active: true })), { onConflict: "provider_id,postcode_district" }) : { error: null };
  if (areaUpsert.error) { logSupabaseFailure("save provider service areas", areaUpsert.error); redirect("/work/profile?error=save"); }
  const areaIdsToRemove = (currentAreas.data || []).filter((area) => !areas.includes(area.postcode_district)).map((area) => area.id);
  if (areaIdsToRemove.length) { const removedAreas = await admin.from("marketplace_provider_service_areas").delete().in("id", areaIdsToRemove); if (removedAreas.error) { logSupabaseFailure("remove provider service areas", removedAreas.error); redirect("/work/profile?error=save"); } }
  const selectedJobTypes = services.map((service) => service.job_type_slug);
  if (selectedJobTypes.length) { const serviceUpsert = await admin.from("marketplace_provider_services").upsert(services.map((service) => ({ ...service, provider_id: provider.providerId, active: true, qualification_verified: verified.get(service.job_type_slug) || false })), { onConflict: "provider_id,job_type_slug" }); if (serviceUpsert.error) { logSupabaseFailure("save provider services", serviceUpsert.error); redirect("/work/profile?error=save"); } }
  const removable = (existing || []).filter((item) => !selectedJobTypes.includes(item.job_type_slug) && !item.qualification_verified).map((item) => item.job_type_slug);
  if (removable.length) { const removedServices = await admin.from("marketplace_provider_services").delete().eq("provider_id", provider.providerId).in("job_type_slug", removable); if (removedServices.error) { logSupabaseFailure("remove provider services", removedServices.error); redirect("/work/profile?error=save"); } }
  redirect("/work/profile?saved=1");
}
