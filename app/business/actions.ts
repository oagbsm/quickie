"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculatePilotQuote, isPilotExtra, isPilotFrequency, isPilotService } from "@/lib/business/pricing";
import { isPracticalBookingTime, londonLocalToUtc } from "@/lib/business/time";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim(),
  optional = (f: FormData, n: string) => value(f, n) || null;
const numberOrNull = (f: FormData, n: string) => {
  const v = value(f, n);
  return v ? Number(v) : null;
};
function getServiceAreaStatus(postcode: string) {
  return /^(SL1|SL2|SL3)/.test(postcode.toUpperCase().replace(/\s+/g, ""))
    ? "eligible"
    : "outside_area";
}
function propertyPayload(f: FormData) {
  const postcode = value(f, "postcode").toUpperCase();
  return {
    nickname: value(f, "nickname"),
    address_line_1: value(f, "addressLine1"),
    address_line_2: optional(f, "addressLine2"),
    city: value(f, "city"),
    postcode,
    property_type: value(f, "propertyType"),
    bedrooms: numberOrNull(f, "bedrooms"),
    bathrooms: numberOrNull(f, "bathrooms"),
    approximate_size: numberOrNull(f, "approximateSize"),
    access_method: value(f, "accessMethod"),
    access_notes: optional(f, "accessNotes"),
    key_instructions: optional(f, "keyInstructions"),
    cleaning_notes: optional(f, "cleaningNotes"),
    linen_requirements: optional(f, "linenRequirements"),
    is_airbnb_turnover: f.get("isAirbnbTurnover") === "on",
    parking_notes: optional(f, "parkingNotes"),
    preferred_frequency: optional(f, "preferredFrequency"),
    service_area_status: getServiceAreaStatus(postcode),
    updated_at: new Date().toISOString(),
  };
}
export async function addProperty(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    p = propertyPayload(f);
  if (
    !p.nickname ||
    !p.address_line_1 ||
    !p.city ||
    !p.postcode ||
    !p.property_type ||
    !p.access_method
  )
    redirect("/business/properties/new?error=required");
  const { error } = await supabase
    .from("properties")
    .insert({ ...p, account_id: accountId });
  if (error) {
    console.error("business_property_create_failed", {
      accountId,
      code: error.code,
    });
    redirect("/business/properties/new?error=save");
  }
  redirect(
    value(f, "returnTo") === "onboarding"
      ? "/business/onboarding?step=setup"
      : "/business/properties?created=1",
  );
}
export async function updateProperty(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    id = value(f, "id"),
    { error } = await supabase
      .from("properties")
      .update(propertyPayload(f))
      .eq("id", id)
      .eq("account_id", accountId);
  if (error) redirect(`/business/properties/${id}?error=save`);
  revalidatePath(`/business/properties/${id}`);
  redirect(`/business/properties/${id}?updated=1`);
}
export async function setPropertyStatus(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    id = value(f, "id"),
    status = value(f, "status");
  if (!["active", "archived"].includes(status)) return;
  if (status === "archived") {
    const { count } = await supabase
      .from("business_bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id)
      .eq("account_id", accountId)
      .in("status", ["requested", "under_review", "confirmed", "assigned", "in_progress"]);
    if ((count || 0) > 0 && value(f, "confirmActiveBookings") !== "1")
      redirect(`/business/properties/${id}?error=active_bookings`);
  }
  await supabase
    .from("properties")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("account_id", accountId);
  revalidatePath("/business/properties");
  revalidatePath(`/business/properties/${id}`);
}
export async function joinServiceAreaWaitlist(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    propertyId = value(f, "propertyId");
  const { data: p } = await supabase
    .from("properties")
    .select("id,postcode,service_area_status")
    .eq("id", propertyId)
    .eq("account_id", accountId)
    .maybeSingle();
  if (!p || p.service_area_status === "eligible") return;
  await supabase
    .from("service_area_requests")
    .upsert(
      { account_id: accountId, property_id: p.id, postcode: p.postcode },
      { onConflict: "property_id", ignoreDuplicates: true },
    );
  await supabase
    .from("properties")
    .update({ service_area_status: "waitlisted" })
    .eq("id", p.id)
    .eq("account_id", accountId);
  revalidatePath("/business/properties");
  revalidatePath(`/business/properties/${p.id}`);
}
export async function createBooking(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    propertyId = value(f, "propertyId"),
    service = value(f, "service"),
    date = value(f, "date"),
    time = value(f, "time");
  if (!propertyId || !service || !date || !time)
    redirect("/business/bookings/new?error=required");
  if (!isPilotService(service) || !isPracticalBookingTime(time))
    redirect("/business/bookings/new?error=invalid_service");
  const { data: p } = await supabase
    .from("properties")
    .select("id,service_area_status,property_type,bedrooms,bathrooms")
    .eq("id", propertyId)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();
  if (!p) redirect("/business/bookings/new?error=property");
  if (p.service_area_status !== "eligible")
    redirect(
      `/business/bookings/new?property=${propertyId}&error=outside_area`,
    );
  const frequency = value(f, "recurrence") || "one_off";
  if (!isPilotFrequency(frequency)) redirect("/business/bookings/new?error=invalid_frequency");
  const extras = f.getAll("extras").map(String).filter(isPilotExtra);
  const quote = calculatePilotQuote({ service, frequency, propertyType: p.property_type, bedrooms: Number(p.bedrooms || 0), bathrooms: Number(p.bathrooms || 1), extras, serviceAreaStatus: p.service_area_status });
  const
    payload: Record<string, unknown> = {
      account_id: accountId,
      property_id: propertyId,
      service,
      scheduled_start: londonLocalToUtc(date, time).toISOString(),
      requirements: optional(f, "requirements"),
      recurrence: frequency,
      extras,
      status: quote.requiresManualReview ? "under_review" : "requested",
      pricing_version: quote.pricingVersion,
      pricing_mode: quote.pricingMode,
      pricing_breakdown: quote.breakdown,
      estimated_price_pence: quote.estimatedPricePence,
      estimated_price_max_pence: quote.estimatedPriceMaxPence,
      duration_minutes: quote.estimatedDurationMinutes,
      requires_manual_review: quote.requiresManualReview,
      customer_price_accepted: !quote.requiresManualReview,
      customer_price_accepted_at: !quote.requiresManualReview ? new Date().toISOString() : null,
    };
  const { error } = await createSupabaseAdminClient().from("business_bookings").insert(payload);
  if (error) {
    console.error("business_booking_request_failed", {
      accountId,
      propertyId,
      code: error.code,
    });
    redirect("/business/bookings/new?error=save");
  }
  redirect("/business/bookings?created=1");
}
export async function acceptTerms(f: FormData) {
  const { supabase, user, accountId } = await requireBusinessUser(),
    version = value(f, "termsVersion");
  if (version !== "business-draft-2026-07")
    redirect("/business/onboarding?error=terms");
  await supabase
    .from("terms_acceptances")
    .upsert(
      { account_id: accountId, user_id: user.id, terms_version: version },
      { onConflict: "account_id,user_id,terms_version" },
    );
  redirect("/business/dashboard");
}
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/business/sign-in");
}
