"use server";
import crypto from "node:crypto";
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
import { normaliseAddressPart, normaliseUkPostcode, UK_POSTCODE_PATTERN } from "@/lib/uk-address";
import { validatePropertyBasics } from "@/lib/business/property-validation";
import { isSupportedTurnoverDuration } from "@/lib/business/turnover-validation";
import type { CalendarProvider } from "@/lib/calendar/types";
import {
  createPropertyCalendarConnection,
  syncPropertyCalendar,
} from "@/lib/server/property-calendars";
const value = (f: FormData, n: string) => String(f.get(n) || "").trim(),
  optional = (f: FormData, n: string) => value(f, n) || null;
const calendarProviderNames: Record<string, string> = {
  airbnb: "Airbnb calendar",
  booking_com: "Booking.com calendar",
  vrbo: "Vrbo calendar",
  expedia: "Expedia calendar",
  other: "Calendar",
};
const numberOrNull = (f: FormData, n: string) => {
  const v = value(f, n);
  return v ? Number(v) : null;
};
function propertyPayload(f: FormData) {
  const postcode = normaliseUkPostcode(value(f, "postcode"));
  return {
    nickname: normaliseAddressPart(value(f, "nickname")),
    address_line_1: normaliseAddressPart(value(f, "addressLine1")),
    address_line_2: optional(f, "addressLine2"),
    city: optional(f, "city"),
    postcode,
    property_type: optional(f, "propertyType"),
    bedrooms: numberOrNull(f, "bedrooms"),
    bathrooms: numberOrNull(f, "bathrooms"),
    approximate_size: numberOrNull(f, "approximateSize"),
    access_method: optional(f, "accessMethod"),
    access_notes: optional(f, "accessNotes"),
    key_instructions: optional(f, "keyInstructions"),
    cleaning_notes: optional(f, "cleaningNotes"),
    linen_requirements: optional(f, "linenRequirements"),
    is_airbnb_turnover: true,
    parking_notes: optional(f, "parkingNotes"),
    floor_lift_notes: optional(f, "floorLiftNotes"),
    preferred_frequency: null,
    service_area_status: getServiceAreaStatus(postcode),
    default_checkout_time: value(f, "defaultCheckoutTime") || "11:00",
    default_checkin_time: value(f, "defaultCheckinTime") || "15:00",
    estimated_turnover_minutes: Number(
      value(f, "estimatedTurnoverMinutes") || 180,
    ),
    bed_configuration: optional(f, "bedConfiguration"),
    towel_requirements: optional(f, "towelRequirements"),
    consumables_instructions: optional(f, "consumablesInstructions"),
    waste_instructions: optional(f, "wasteInstructions"),
    key_return_instructions: optional(f, "keyReturnInstructions"),
    required_completion_photos: Number(
      value(f, "requiredCompletionPhotos") || 4,
    ),
    sofa_bed_required: f.get("sofaBedRequired") === "on",
    heating_instructions: optional(f, "heatingInstructions"),
    lighting_instructions: optional(f, "lightingInstructions"),
    emergency_contact: optional(f, "emergencyContact"),
    internal_notes: optional(f, "internalNotes"),
    updated_at: new Date().toISOString(),
  };
}
async function savePropertyImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  accountId: string,
  propertyId: string,
  f: FormData,
) {
  const image = f.get("propertyImage");
  if (!(image instanceof File) || image.size === 0) return;
  if (
    image.size > 10 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(image.type)
  )
    throw new Error("invalid_property_image");
  const extension =
    image.type === "image/png"
      ? "png"
      : image.type === "image/webp"
        ? "webp"
        : "jpg";
  const path = `${accountId}/${propertyId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("property-images")
    .upload(path, image, {
      contentType: image.type,
      upsert: false,
    });
  if (uploadError) throw uploadError;
  const { error: updateError } = await supabase
    .from("properties")
    .update({ image_path: path })
    .eq("id", propertyId)
    .eq("account_id", accountId);
  if (updateError) throw updateError;
}
export async function addProperty(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    p = propertyPayload(f);
  const initialBasicsOnly = !p.city && !p.property_type && p.bathrooms === null;
  const requestedDuration = value(f, "estimatedTurnoverMinutes");
  const reservationCalendarUrl = value(f, "reservationCalendarUrl");
  const reservationProvider = value(f, "reservationProvider");
  if (
    !p.nickname ||
    !p.address_line_1 ||
    !p.postcode ||
    p.bedrooms === null ||
    !Number.isInteger(p.bedrooms) ||
    p.bedrooms < 0 ||
    p.bedrooms > (initialBasicsOnly ? 5 : 100) ||
    !UK_POSTCODE_PATTERN.test(p.postcode) ||
    (initialBasicsOnly && requestedDuration && !isSupportedTurnoverDuration(Number(requestedDuration))) ||
    (reservationCalendarUrl && !Object.hasOwn(calendarProviderNames, reservationProvider))
  )
    redirect("/business/properties/new?error=required");
  const { data: duplicate } = await supabase.from("properties").select("id").eq("account_id", accountId).ilike("address_line_1", p.address_line_1).eq("postcode", p.postcode).neq("status", "archived").limit(1).maybeSingle();
  if (duplicate) redirect(`/business/properties/new?error=duplicate&existing=${duplicate.id}`);
  const { data: created, error } = await supabase
    .from("properties")
    .insert({ ...p, account_id: accountId })
    .select("id")
    .single();
  if (error) {
    console.error("business_property_create_failed", {
      accountId,
      code: error.code,
    });
    redirect("/business/properties/new?error=save");
  }
  const duplicatePropertyId = value(f, "duplicatePropertyId");
  if (duplicatePropertyId && created?.id) {
    const { error: cloneError } = await supabase.rpc(
      "clone_property_checklist",
      {
        source_property: duplicatePropertyId,
        target_property: created.id,
      },
    );
    if (cloneError)
      redirect(`/business/properties/${created.id}?error=checklist`);
  }
  const extraTasks = f
    .getAll("extraChecklistTask")
    .map(String)
    .map((task) => task.trim())
    .filter(Boolean);
  if (extraTasks.length && created?.id) {
    const { data: template } = await supabase
      .from("checklist_templates")
      .select("id")
      .eq("property_id", created.id)
      .eq("active", true)
      .maybeSingle();
    if (template) {
      let { data: section } = await supabase
        .from("checklist_template_sections")
        .select("id")
        .eq("template_id", template.id)
        .eq("title", "Property-specific")
        .maybeSingle();
      if (!section) {
        const result = await supabase
          .from("checklist_template_sections")
          .insert({
            template_id: template.id,
            title: "Property-specific",
            position: 99,
          })
          .select("id")
          .single();
        section = result.data;
      }
      if (section)
        await supabase.from("checklist_template_tasks").insert(
          extraTasks.map((label, index) => ({
            section_id: section.id,
            label,
            position: index + 1,
            mandatory: true,
          })),
        );
    }
  }
  if (created?.id) {
    if (reservationCalendarUrl) {
      try {
        const connectionId = await createPropertyCalendarConnection({
          propertyId: created.id,
          provider: reservationProvider as CalendarProvider,
          displayName: calendarProviderNames[reservationProvider] || "Calendar",
          calendarUrl: reservationCalendarUrl,
        });
        try {
          await syncPropertyCalendar(connectionId);
        } catch (syncError) {
          console.error("business_property_calendar_sync_failed", {
            accountId,
            propertyId: created.id,
            syncError,
          });
        }
      } catch (calendarError) {
        console.error("business_property_calendar_connect_failed", {
          accountId,
          propertyId: created.id,
          calendarError,
        });
      }
    }
    try {
      await savePropertyImage(supabase, accountId, created.id, f);
    } catch (imageError) {
      console.error("business_property_image_failed", {
        accountId,
        propertyId: created.id,
        imageError,
      });
      redirect(`/business/properties/${created.id}?error=image`);
    }
  }
  revalidatePath("/business/dashboard");
  revalidatePath("/business/properties");
  revalidatePath("/business/turnovers/new");
  revalidatePath("/business/settings");
  revalidatePath("/business/activity");
  redirect(
    value(f, "returnTo") === "onboarding"
      ? `/business/onboarding?step=standard&property=${created?.id || ""}`
      : `/business/properties/${created?.id}?created=1`,
  );
}

export type OnboardingPropertyState = {
  errors: ReturnType<typeof validatePropertyBasics>;
};

export async function addOnboardingProperty(
  _previousState: OnboardingPropertyState,
  form: FormData,
): Promise<OnboardingPropertyState> {
  const errors = validatePropertyBasics(form);
  if (Object.keys(errors).length) return { errors };
  return addProperty(form) as never;
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
  try {
    await savePropertyImage(supabase, accountId, id, f);
  } catch (imageError) {
    console.error("business_property_image_failed", {
      accountId,
      propertyId: id,
      imageError,
    });
    redirect(`/business/properties/${id}?error=image`);
  }
  revalidatePath("/business/dashboard");
  revalidatePath("/business/properties");
  revalidatePath(`/business/properties/${id}`);
  revalidatePath("/business/turnovers/new");
  revalidatePath("/business/settings");
  redirect(`/business/properties/${id}?updated=1`);
}
export async function updatePropertySection(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser();
  const id = value(f, "id"),
    section = value(f, "section");
  const payload =
    section === "standard"
      ? {
          default_checkout_time: value(f, "defaultCheckoutTime"),
          default_checkin_time: value(f, "defaultCheckinTime"),
          estimated_turnover_minutes: Number(
            value(f, "estimatedTurnoverMinutes"),
          ),
          bed_configuration: optional(f, "bedConfiguration"),
          sofa_bed_required: f.get("sofaBedRequired") === "on",
          linen_requirements: optional(f, "linenRequirements"),
          towel_requirements: optional(f, "towelRequirements"),
          waste_instructions: optional(f, "wasteInstructions"),
          consumables_instructions: optional(f, "consumablesInstructions"),
          cleaning_notes: optional(f, "cleaningNotes"),
          required_completion_photos: Number(
            value(f, "requiredCompletionPhotos") || 4,
          ),
          updated_at: new Date().toISOString(),
        }
      : section === "access"
        ? {
            access_notes: optional(f, "accessNotes"),
            key_instructions: optional(f, "keyInstructions"),
            key_return_instructions: optional(f, "keyReturnInstructions"),
            parking_notes: optional(f, "parkingNotes"),
            floor_lift_notes: optional(f, "floorLiftNotes"),
            heating_instructions: optional(f, "heatingInstructions"),
            lighting_instructions: optional(f, "lightingInstructions"),
            emergency_contact: optional(f, "emergencyContact"),
            internal_notes: optional(f, "internalNotes"),
            updated_at: new Date().toISOString(),
          }
        : null;
  if (!payload) return;
  const { error } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", id)
    .eq("account_id", accountId);
  if (error)
    redirect(`/business/properties/${id}?tab=${section}&edit=1&error=save`);
  revalidatePath(`/business/properties/${id}`);
  revalidatePath("/business/properties");
  redirect(`/business/properties/${id}?tab=${section}&updated=1`);
}

export type AccessRevealState = {
  revealed: boolean;
  message?: string;
  accessNotes?: string | null;
  keyInstructions?: string | null;
  parkingNotes?: string | null;
  floorLiftNotes?: string | null;
};
export async function revealPropertyAccess(
  _state: AccessRevealState,
  f: FormData,
): Promise<AccessRevealState> {
  const { supabase, accountId, user } = await requireBusinessUser();
  const id = value(f, "propertyId");
  const { data, error } = await supabase
    .from("properties")
    .select("access_notes,key_instructions,parking_notes,floor_lift_notes")
    .eq("id", id)
    .eq("account_id", accountId)
    .maybeSingle();
  if (error || !data)
    return {
      revealed: false,
      message: "Access details could not be revealed.",
    };
  await supabase.from("activity_events").insert({
    account_id: accountId,
    property_id: id,
    actor_user_id: user.id,
    event_type: "property_access_revealed",
    description: "Sensitive property access details were revealed by the owner",
  });
  revalidatePath(`/business/properties/${id}`);
  return {
    revealed: true,
    accessNotes: data.access_notes,
    keyInstructions: data.key_instructions,
    parkingNotes: data.parking_notes,
    floorLiftNotes: data.floor_lift_notes,
  };
}
export async function setPropertyStatus(f: FormData) {
  const { supabase, accountId } = await requireBusinessUser(),
    id = value(f, "id"),
    status = value(f, "status");
  if (!["active", "archived"].includes(status)) return;
  if (status === "archived") {
    const { count } = await supabase
      .from("work_items")
      .select("id", { count: "exact", head: true })
      .eq("property_id", id)
      .eq("account_id", accountId)
      .in("status", [
        "unassigned",
        "awaiting_response",
        "accepted",
        "en_route",
        "arrived",
        "in_progress",
        "evidence_submitted",
        "action_required",
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
  revalidatePath("/business/dashboard");
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
  revalidatePath("/business/dashboard");
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
  revalidatePath("/business/bookings");
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
