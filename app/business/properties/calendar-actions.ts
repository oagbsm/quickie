"use server";

import { revalidatePath } from "next/cache";
import type { CalendarActionState } from "@/lib/calendar/action-state";
import type { CalendarProvider } from "@/lib/calendar/types";
import {
  createPropertyCalendarConnection,
  managePropertyCalendarConnection,
  PropertyCalendarError,
  syncPropertyCalendar,
} from "@/lib/server/property-calendars";

const providers = new Set<CalendarProvider>([
  "airbnb",
  "booking_com",
  "vrbo",
  "expedia",
  "other",
]);

function errorState(error: unknown): CalendarActionState {
  const message =
    error instanceof PropertyCalendarError
      ? error.message
      : "The reservation source could not be updated. Try again.";
  return { status: "error", message, summary: "", fieldErrors: {} };
}

function refresh(propertyId: string) {
  revalidatePath(`/business/properties/${propertyId}`);
  revalidatePath("/business/reservations");
  revalidatePath("/business/turnovers");
}

export async function connectCalendarAction(
  propertyId: string,
  _previous: CalendarActionState,
  form: FormData,
): Promise<CalendarActionState> {
  const provider = String(form.get("provider") || "") as CalendarProvider;
  const displayName = String(form.get("displayName") || "").trim();
  const calendarUrl = String(form.get("calendarUrl") || "").trim();
  const fieldErrors: CalendarActionState["fieldErrors"] = {};
  if (!providers.has(provider)) fieldErrors.provider = "Select a platform.";
  if (displayName.length > 80)
    fieldErrors.displayName = "Connection name must be 80 characters or fewer.";
  if (!calendarUrl) fieldErrors.calendarUrl = "Enter the private calendar URL.";
  if (Object.keys(fieldErrors).length)
    return {
      status: "error",
      message: "Review the reservation source details.",
      summary: "",
      fieldErrors,
    };
  try {
    const connectionId = await createPropertyCalendarConnection({
      propertyId,
      provider,
      displayName,
      calendarUrl,
    });
    try {
      const result = await syncPropertyCalendar(connectionId);
      refresh(propertyId);
      return {
        status: "success",
        message:
          result.status === "healthy"
            ? "Calendar connected and synchronised."
            : "Calendar connected and needs attention.",
        summary: `${result.summary.imported} imported, ${result.summary.updated} updated, ${result.summary.cancelled} cancelled`,
        fieldErrors: {},
      };
    } catch (error) {
      refresh(propertyId);
      const state = errorState(error);
      return {
        ...state,
        message: "Calendar connected, but the initial sync needs attention.",
      };
    }
  } catch (error) {
    const state = errorState(error);
    return {
      ...state,
      fieldErrors: { calendarUrl: state.message },
    };
  }
}

export async function syncCalendarAction(
  propertyId: string,
  connectionId: string,
  _previous: CalendarActionState,
  _form: FormData,
): Promise<CalendarActionState> {
  void _previous;
  void _form;
  try {
    const result = await syncPropertyCalendar(connectionId);
    refresh(propertyId);
    return {
      status: result.status === "healthy" ? "success" : "error",
      message:
        result.status === "healthy" ? "Sync complete." : "Calendar needs attention.",
      summary: `${result.summary.imported} imported, ${result.summary.updated} updated, ${result.summary.cancelled} cancelled`,
      fieldErrors: {},
    };
  } catch (error) {
    refresh(propertyId);
    return errorState(error);
  }
}

export async function manageCalendarAction(
  propertyId: string,
  connectionId: string,
  _previous: CalendarActionState,
  form: FormData,
): Promise<CalendarActionState> {
  const intent = String(form.get("intent") || "");
  if (!new Set(["rename", "disable", "enable", "replace_url", "remove"]).has(intent))
    return errorState(new Error("invalid_action"));
  if (intent === "remove" && form.get("confirmRemove") !== "yes")
    return {
      status: "error",
      message: "Confirm removal before continuing.",
      summary: "",
      fieldErrors: {},
    };
  try {
    await managePropertyCalendarConnection({
      connectionId,
      action: intent as "rename" | "disable" | "enable" | "replace_url" | "remove",
      displayName: String(form.get("displayName") || ""),
      calendarUrl: String(form.get("calendarUrl") || ""),
    });
    refresh(propertyId);
    return {
      status: "success",
      message: intent === "remove" ? "Reservation source removed." : "Reservation source updated.",
      summary: "",
      fieldErrors: {},
    };
  } catch (error) {
    return errorState(error);
  }
}
