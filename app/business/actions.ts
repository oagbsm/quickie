"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBusinessUser } from "@/lib/business/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  calculatePilotQuote,
  isPilotExtra,
  isPilotFrequency,
  isPilotService,
} from "@/lib/business/pricing";
import { validatePilotSchedule } from "@/lib/business/time";
import { sendBookingReceivedEmail } from "@/lib/server/business-notifications";
import { getServiceAreaStatus } from "@/lib/business/service-area";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim(),
  optional = (f: FormData, n: string) => value(f, n) || null;
const numberOrNull = (f: FormData, n: string) => {
  const v = value(f, n);
  return v ? Number(v) : null;
};
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
      .in("status", [
        "requested",
        "under_review",
        "confirmed",
        "awaiting_customer_confirmation",
        "provider_assigned",
        "on_the_way",
        "arrived",
        "in_progress",
      ]);
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
export type BookingActionState = { message: string; code?: string };

export async function acceptBookingChange(f: FormData) {
  const { supabase } = await requireBusinessUser();
  const id = value(f, "bookingId");
  const { error } = await supabase.rpc("customer_accept_booking_change", {
    target_booking: id,
  });
  if (error)
    redirect(
      `/business/bookings/${id}?error=${encodeURIComponent(error.message)}`,
    );
  revalidatePath("/business/dashboard");
  revalidatePath(`/business/bookings/${id}`);
  redirect(`/business/bookings/${id}?accepted=1`);
}
export async function createBooking(
  _previousState: BookingActionState,
  f: FormData,
): Promise<BookingActionState> {
  const { supabase, accountId, user } = await requireBusinessUser(),
    propertyId = value(f, "propertyId"),
    service = value(f, "service"),
    date = value(f, "date"),
    time = value(f, "time"),
    idempotencyKey = value(f, "idempotencyKey");
  if (!propertyId || !service || !date || !time)
    return {
      message: "Complete the property, service and schedule before submitting.",
      code: "required",
    };
  if (!isPilotService(service))
    return {
      message: "Choose one of the available cleaning services.",
      code: "invalid_service",
    };
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      idempotencyKey,
    )
  )
    return {
      message: "Refresh this page before trying again.",
      code: "invalid_request",
    };
  const { data: p } = await supabase
    .from("properties")
    .select("id,service_area_status,property_type,bedrooms,bathrooms")
    .eq("id", propertyId)
    .eq("account_id", accountId)
    .eq("status", "active")
    .maybeSingle();
  if (!p)
    return {
      message:
        "That property is unavailable or does not belong to this account.",
      code: "property",
    };
  if (p.service_area_status !== "eligible")
    return {
      message:
        "We’re not yet fulfilling cleans in this postcode. You can still manage the property here, and we’ll let you know when Quickola becomes available in your area.",
      code: "outside_area",
    };
  const frequency = value(f, "recurrence") || "one_off";
  if (!isPilotFrequency(frequency))
    return {
      message: "Choose a valid cleaning frequency.",
      code: "invalid_frequency",
    };
  const extras = f.getAll("extras").map(String).filter(isPilotExtra);
  const quote = calculatePilotQuote({
    service,
    frequency,
    propertyType: p.property_type,
    bedrooms: Number(p.bedrooms || 0),
    bathrooms: Number(p.bathrooms || 1),
    extras,
    serviceAreaStatus: p.service_area_status,
  });
  const schedule = validatePilotSchedule(
    date,
    time,
    quote.estimatedDurationMinutes,
  );
  if (!schedule.ok)
    return {
      message:
        schedule.reason === "lead_time"
          ? "Choose a start time at least 24 hours from now."
          : schedule.reason === "closed_day"
            ? "Quickola currently accepts cleaning requests Monday to Saturday."
            : "Choose an available start time that allows the clean to finish within operating hours.",
      code: schedule.reason,
    };
  const payload: Record<string, unknown> = {
    account_id: accountId,
    property_id: propertyId,
    service,
    scheduled_start: schedule.scheduledStart.toISOString(),
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
    customer_price_accepted_at: !quote.requiresManualReview
      ? new Date().toISOString()
      : null,
    idempotency_key: idempotencyKey,
    actor_user_id: user.id,
  };
  const { data: booking, error } = await createSupabaseAdminClient().rpc(
    "server_create_business_booking",
    { payload },
  );
  if (error || !booking?.id) {
    console.error("business_booking_request_failed", {
      accountId,
      propertyId,
      code: error?.code || "missing_booking",
    });
    return error?.message?.includes("booking_time_conflict")
      ? {
          message:
            "This time overlaps another active booking for this property. Choose a different time.",
          code: "conflict",
        }
      : {
          message:
            "We could not submit the request. Your selections are still here—please try again.",
          code: "save",
        };
  }
  await sendBookingReceivedEmail({
    accountId,
    bookingId: booking.id,
    propertyId,
    service,
    scheduledStart: schedule.scheduledStart.toISOString(),
  });
  revalidatePath("/business/dashboard");
  revalidatePath("/business/bookings");
  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  redirect(`/business/bookings/${booking.id}/confirmation`);
}
export async function acceptTerms(f: FormData) {
  const { supabase, user, accountId } = await requireBusinessUser(),
    version = value(f, "termsVersion");
  if (version !== "business-pilot-2026-07-22")
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
