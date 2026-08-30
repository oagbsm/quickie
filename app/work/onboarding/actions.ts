"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { MAIDENHEAD_MARKET_POSTCODE_DISTRICTS, marketplaceServices } from "@/app/data/marketplace";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMarketplaceProvider, isProviderProfileComplete } from "@/lib/marketplace/provider-access";
import { createProviderPayoutLink, refreshProviderPayoutStatus } from "@/lib/server/provider-stripe";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const value = (form: FormData, name: string) => String(form.get(name) || "").trim();

function selectedServices(form: FormData) {
  const allowed = new Set(marketplaceServices.flatMap((service) => service.jobs.filter((job) => job.active).map((job) => `${service.slug}|${job.slug}`)));
  return [...new Set(form.getAll("service").map(String).filter((item) => allowed.has(item)))];
}

async function saveServicesAndCoverage(providerId: string, services: string[]) {
  const admin = createSupabaseAdminClient();
  const { data: existing, error: existingError } = await admin.from("marketplace_provider_services").select("category_slug,job_type_slug,qualification_verified").eq("provider_id", providerId);
  if (existingError) redirect("/work/onboarding?error=save");
  const verified = new Set((existing || []).filter((item) => item.qualification_verified).map((item) => `${item.category_slug}|${item.job_type_slug}`));
  const removed = await admin.from("marketplace_provider_services").delete().eq("provider_id", providerId);
  if (removed.error) redirect("/work/onboarding?error=save");
  if (services.length) {
    const inserted = await admin.from("marketplace_provider_services").insert(services.map((item) => { const [category_slug, job_type_slug] = item.split("|"); return { provider_id: providerId, category_slug, job_type_slug, active: true, qualification_verified: verified.has(item) }; }));
    if (inserted.error) redirect("/work/onboarding?error=save");
  }
  if (services.length) {
    const areas = await admin.from("marketplace_provider_service_areas").upsert(MAIDENHEAD_MARKET_POSTCODE_DISTRICTS.map((postcode_district) => ({ provider_id: providerId, postcode_district, active: true })), { onConflict: "provider_id,postcode_district" });
    if (areas.error) redirect("/work/onboarding?error=save");
  }
}

export async function saveProviderOnboarding(form: FormData) {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  if (provider.providerStatus === "pending_review") redirect("/work/onboarding");
  if (!provider.emailConfirmedAt) redirect("/work/onboarding?error=email_unverified");
  const providerType = value(form, "providerType") || String(provider.profile.provider_type || "");
  const displayName = value(form, "displayName") || String(provider.profile.display_name || "");
  const businessName = value(form, "businessName") || String(provider.profile.business_name || "");
  const phone = value(form, "phone") || String(provider.profile.phone || "");
  const termsAccepted = form.get("termsAccepted") === "on";
  const services = selectedServices(form);
  const currentStep = Math.min(3, Math.max(1, Number(value(form, "currentStep")) || 1));
  if (!["individual", "business"].includes(providerType) || !phone || !/^\+?[0-9 ()-]{9,20}$/.test(phone) || (providerType === "individual" && displayName.length < 2) || (providerType === "business" && businessName.length < 2) || (currentStep === 2 && !services.length)) redirect("/work/onboarding?error=required");
  const admin = createSupabaseAdminClient();
  const photo = form.get("profilePhoto");
  let photoPath = String(form.get("existingPhotoPath") || "") || null;
  if (photo instanceof File && photo.size > 0) {
    if (!allowedPhotoTypes.has(photo.type) || photo.size > MAX_PHOTO_BYTES) redirect("/work/onboarding?error=photo");
    photoPath = `${provider.providerId}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await admin.storage.from("marketplace-provider-photos").upload(photoPath, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: true });
    if (upload.error) redirect("/work/onboarding?error=photo");
  }
  const update = await admin.from("marketplace_providers").update({ display_name: displayName || businessName, business_name: businessName || null, phone, provider_type: providerType, profile_photo_url: photoPath, base_town: "Maidenhead", ...(termsAccepted ? { provider_terms_accepted_at: new Date().toISOString(), terms_version: "provider-2026-08" } : {}), updated_at: new Date().toISOString() }).eq("user_id", provider.providerId);
  if (update.error) redirect("/work/onboarding?error=save");
  if (services.length || currentStep >= 2) await saveServicesAndCoverage(provider.providerId, services);
  revalidatePath("/work");
  revalidatePath("/work/onboarding");
  redirect(`/work/onboarding?saved=1&step=${Math.min(3, currentStep + 1)}`);
}

export async function updateProviderTerms(accepted: boolean) {
  const provider = await getMarketplaceProvider();
  if (!provider) return { ok: false as const, error: "auth" };
  if (!provider.emailConfirmedAt) return { ok: false as const, error: "email_unverified" };
  const admin = createSupabaseAdminClient();
  const update = await admin.from("marketplace_providers").update({
    provider_terms_accepted_at: accepted ? new Date().toISOString() : null,
    terms_version: accepted ? "provider-2026-08" : null,
    updated_at: new Date().toISOString(),
  }).eq("user_id", provider.providerId);
  if (update.error) return { ok: false as const, error: "save" };
  revalidatePath("/work/onboarding");
  return { ok: true as const, accepted };
}

export async function uploadProviderProfilePhoto(form: FormData) {
  const provider = await getMarketplaceProvider();
  if (!provider) return { ok: false as const, error: "auth" };
  const admin = createSupabaseAdminClient();
  const photo = form.get("profilePhoto");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false as const, error: "photo" };
  if (!allowedPhotoTypes.has(photo.type) || photo.size > MAX_PHOTO_BYTES) return { ok: false as const, error: "photo" };
  const photoPath = `${provider.providerId}/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const upload = await admin.storage.from("marketplace-provider-photos").upload(photoPath, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type, upsert: true });
  if (upload.error) return { ok: false as const, error: "photo" };
  const update = await admin.from("marketplace_providers").update({ profile_photo_url: photoPath, updated_at: new Date().toISOString() }).eq("user_id", provider.providerId);
  if (update.error) return { ok: false as const, error: "save" };
  revalidatePath("/work/onboarding");
  return { ok: true as const, photoPath };
}

export async function submitProviderApplication() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  if (provider.providerStatus === "pending_review") redirect("/work/onboarding");
  if (!provider.emailConfirmedAt) redirect("/work/onboarding?error=email_unverified");
  const admin = createSupabaseAdminClient();
  const [{ data: profile }, { count: servicesCount }, { count: areasCount }] = await Promise.all([
    admin.from("marketplace_providers").select("*").eq("user_id", provider.providerId).maybeSingle(),
    admin.from("marketplace_provider_services").select("id", { count: "exact", head: true }).eq("provider_id", provider.providerId).eq("active", true),
    admin.from("marketplace_provider_service_areas").select("id", { count: "exact", head: true }).eq("provider_id", provider.providerId).eq("active", true),
  ]);
  if (profile?.provider_status === "suspended") redirect("/work/onboarding?error=suspended");
  if (!profile || !isProviderProfileComplete(profile, servicesCount || 0, areasCount || 0)) redirect("/work/onboarding?error=incomplete");
  if (!profile.provider_terms_accepted_at) redirect("/work/onboarding?error=terms");
  if (profile.provider_status === "approved") redirect("/work");
  await admin.from("marketplace_providers").update({ provider_status: "pending_review", submitted_at: new Date().toISOString(), action_required_reason: null, updated_at: new Date().toISOString() }).eq("user_id", provider.providerId).in("provider_status", ["draft", "action_required"]);
  await admin.from("marketplace_provider_status_history").insert({ provider_id: provider.providerId, from_status: provider.providerStatus, to_status: "pending_review", changed_by: provider.user.id });
  revalidatePath("/work");
  redirect("/work/onboarding");
}

export async function startProviderPayoutSetup(formData?: FormData) {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  const returnPath = formData?.get("returnPath") === "/work/profile" ? "/work/profile" : "/work/onboarding";
  let payoutUrl: string;
  try {
    payoutUrl = await createProviderPayoutLink(provider.providerId, returnPath);
  } catch (error) {
    redirect(`${returnPath}?error=${error instanceof Error && error.message === "provider_email_missing" ? "provider_email_missing" : "stripe"}`);
  }
  redirect(payoutUrl);
}

export async function refreshProviderPayoutSetup() {
  const provider = await getMarketplaceProvider();
  if (!provider) redirect("/pro/login?next=/work/onboarding");
  try { await refreshProviderPayoutStatus(provider.providerId); } catch { /* status is refreshed on the next load */ }
  revalidatePath("/work");
  revalidatePath("/work/onboarding");
  redirect("/work/onboarding?payouts=checked&step=3");
}
