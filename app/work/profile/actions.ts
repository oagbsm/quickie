"use server";

import { redirect } from "next/navigation";
import { marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getApprovedMarketplaceProvider } from "@/lib/marketplace/provider-access";

const text = (form: FormData, name: string) => String(form.get(name) || "").trim();

function postcodeDistricts(value: string) {
  return [...new Set((value.toUpperCase().match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\b/g) || []))];
}

export async function updateProviderProfile(form: FormData) {
  const provider = await getApprovedMarketplaceProvider();
  if (!provider) redirect("/pro/login?error=not-approved");
  const displayName = text(form, "displayName");
  const businessName = text(form, "businessName");
  const areas = postcodeDistricts(text(form, "serviceAreas"));
  const selectedCategories = new Set(form.getAll("category").map(String));
  const services = marketplaceServices
    .filter((service) => selectedCategories.has(service.slug))
    .flatMap((service) => service.jobs.filter((job) => job.active).map((job) => ({ category_slug: service.slug, job_type_slug: job.slug })));
  if (displayName.length < 1 || displayName.length > 120 || !areas.length || !services.length)
    redirect("/work/profile?error=required");

  const admin = createSupabaseAdminClient();
  const { data: existing } = await admin
    .from("marketplace_provider_services")
    .select("job_type_slug,qualification_verified")
    .eq("provider_id", provider.user.id);
  const verified = new Map((existing || []).map((item) => [item.job_type_slug, item.qualification_verified]));
  const profile = await admin.from("cleaner_profiles").update({
    display_name: displayName,
    business_name: businessName || displayName,
    service_area: areas.join(", "),
    phone: text(form, "phone") || null,
    marketplace_bio: text(form, "bio") || null,
    profile_photo_url: text(form, "profilePhotoUrl") || null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", provider.user.id).eq("marketplace_active", true);
  if (profile.error) redirect("/work/profile?error=save");

  await admin.from("marketplace_provider_service_areas").delete().eq("provider_id", provider.user.id);
  if (areas.length) await admin.from("marketplace_provider_service_areas").insert(areas.map((postcode_district) => ({ provider_id: provider.user.id, postcode_district, active: true })));
  const selectedJobTypes = services.map((service) => service.job_type_slug);
  if (selectedJobTypes.length) await admin.from("marketplace_provider_services").upsert(services.map((service) => ({ ...service, provider_id: provider.user.id, active: true, qualification_verified: verified.get(service.job_type_slug) || false })), { onConflict: "provider_id,job_type_slug" });
  const removable = (existing || []).filter((item) => !selectedJobTypes.includes(item.job_type_slug) && !item.qualification_verified).map((item) => item.job_type_slug);
  if (removable.length) await admin.from("marketplace_provider_services").delete().eq("provider_id", provider.user.id).in("job_type_slug", removable);
  redirect("/work/profile?saved=1");
}
