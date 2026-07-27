import { BUSINESS_TIME_ZONE, formatBusinessDateTime } from "../business/time.ts";

export type ReservationEventView = {
  id: string;
  event_type: string;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  sequence?: number;
};

export type ReservationTimelineItem = {
  title: string;
  detail: string | null;
};

const dateTimeKeys = new Set([
  "check_in_at",
  "check_out_at",
  "guest_checkout_at",
  "window_start_at",
  "window_end_at",
  "next_check_in_at",
  "cancelled_at",
]);

const labels: Record<string, string> = {
  property_id: "Property",
  guest_name: "Guest name",
  guest_count: "Guest count",
  check_in_at: "Check-in",
  check_out_at: "Check-out",
  turnover_date: "Turnover date",
  window_start_at: "Window start",
  window_end_at: "Window end",
  next_check_in_at: "Next check-in",
  requires_attention: "Timing attention",
};

function displayValue(
  key: string,
  raw: unknown,
  metadata: Record<string, unknown>,
  side: "previous" | "new",
) {
  if (key === "property_id") {
    const propertyName = metadata[
      side === "previous" ? "previous_property_name" : "new_property_name"
    ];
    return typeof propertyName === "string" ? propertyName : "another property";
  }
  if (raw === null || raw === undefined || raw === "") return "not provided";
  if (dateTimeKeys.has(key) && typeof raw === "string")
    return formatBusinessDateTime(raw, {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  if (key === "turnover_date" && typeof raw === "string")
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeZone: BUSINESS_TIME_ZONE,
    }).format(new Date(`${raw}T12:00:00Z`));
  if (typeof raw === "boolean") return raw ? "required" : "not required";
  return String(raw);
}

function changes(event: ReservationEventView) {
  const previous = event.previous_values || {};
  const next = event.new_values || {};
  const metadata = event.metadata || {};
  return Object.keys(next)
    .filter((key) => key in previous && key !== "status" && key !== "cancelled_at")
    .map(
      (key) =>
        `${labels[key] || key.replaceAll("_", " ")} changed from ${displayValue(key, previous[key], metadata, "previous")} to ${displayValue(key, next[key], metadata, "new")}`,
    );
}

export function formatReservationEvent(
  event: ReservationEventView,
): ReservationTimelineItem {
  if (event.event_type === "reservation.created")
    return { title: "Reservation created", detail: null };
  if (event.event_type === "turnover.created")
    return { title: "Turnover created", detail: "The cleaning window was scheduled." };
  if (event.event_type === "reservation.cancelled")
    return { title: "Reservation cancelled", detail: null };
  if (event.event_type === "turnover.cancelled")
    return { title: "Turnover cancelled", detail: null };

  const descriptions = changes(event);
  if (event.event_type === "reservation.updated")
    return descriptions.length === 1
      ? { title: descriptions[0], detail: null }
      : {
          title: "Reservation updated",
          detail: descriptions.length ? descriptions.join("; ") : null,
        };
  if (event.event_type === "turnover.updated")
    return {
      title: "Turnover rescheduled",
      detail: descriptions.length ? descriptions.join("; ") : null,
    };
  return { title: "Reservation activity recorded", detail: null };
}

export function isSameLondonDate(first: string, second: string | null) {
  if (!second) return false;
  const key = (value: string) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  return key(first) === key(second);
}
