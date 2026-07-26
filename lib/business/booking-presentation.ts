import {
  activeBookingStatuses,
  getBookingStatus,
  isBookingStatus,
} from "./booking-status.ts";
import { formatBusinessDateTime } from "./time.ts";

type ScheduleInput = {
  status: string;
  scheduledStart: string;
  estimatedArrivalStart?: string | null;
  estimatedArrivalEnd?: string | null;
};

export function getCustomerBookingPresentation(input: ScheduleInput) {
  const status = getBookingStatus(input.status);
  const requested = ["requested", "under_review", "awaiting_customer_confirmation"].includes(
    input.status,
  );
  const scheduled = formatBusinessDateTime(input.scheduledStart);
  const arrivalStart = input.estimatedArrivalStart
    ? formatBusinessDateTime(input.estimatedArrivalStart, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;
  const arrivalEnd = input.estimatedArrivalEnd
    ? formatBusinessDateTime(input.estimatedArrivalEnd, {
        timeStyle: "short",
      })
    : null;

  return {
    statusLabel: status.customerLabel,
    scheduleLabel: requested
      ? `Requested for ${scheduled}`
      : arrivalStart
        ? `Arrival ${arrivalStart}${arrivalEnd ? `–${arrivalEnd}` : ""}`
        : `Scheduled for ${scheduled}`,
    supportingMessage: requested
      ? "Quickola is confirming availability and timing."
      : input.status === "confirmed" && !arrivalStart
        ? "The cleaner’s live arrival estimate will be shared closer to the booking."
        : input.status === "provider_assigned" && !arrivalStart
          ? "Your cleaner is arranged; the live arrival estimate will follow closer to the booking."
          : status.customerCopy,
  };
}

export function getPropertyOperationalStatus(input: {
  propertyStatus: string;
  serviceAreaStatus: string;
  bookings: readonly { status: string; scheduled_start: string }[];
  now: Date;
}) {
  if (input.propertyStatus !== "active") return "Inactive";
  if (input.serviceAreaStatus !== "eligible") return "Outside service area";
  if (
    input.bookings.some(
      (booking) => booking.status === "awaiting_customer_confirmation",
    )
  )
    return "Action required";
  if (
    input.bookings.some(
      (booking) =>
        isBookingStatus(booking.status) &&
        activeBookingStatuses.includes(booking.status) &&
        new Date(booking.scheduled_start) > input.now,
    )
  )
    return "Cleaning scheduled";
  return "No upcoming booking";
}
