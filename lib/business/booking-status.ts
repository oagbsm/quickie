export const BOOKING_STATUSES = [
  "requested",
  "under_review",
  "awaiting_customer_confirmation",
  "confirmed",
  "provider_assigned",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "unable_to_fulfil",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type BookingTone = "neutral" | "warning" | "success" | "danger";
export type PriceCertainty = "firm" | "provisional" | "historical";

export type BookingPresentation = {
  customerLabel: string;
  customerTitle: string;
  adminLabel: string;
  customerCopy: string;
  actionCopy: string;
  actionRequired: boolean;
  tone: BookingTone;
  timelineStep: 0 | 1 | 2 | 3 | 4;
  priceCertainty: PriceCertainty;
  terminalException: boolean;
};

export const bookingStatusConfig: Record<BookingStatus, BookingPresentation> = {
  requested: {
    customerLabel: "Booking received",
    customerTitle: "Booking received",
    adminLabel: "Requested",
    customerCopy: "We’ve received your booking and are arranging the service.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "neutral",
    timelineStep: 0,
    priceCertainty: "firm",
    terminalException: false,
  },
  under_review: {
    customerLabel: "Under review",
    customerTitle: "Request under review",
    adminLabel: "Under review",
    customerCopy: "We’re checking the details of this non-standard request and will confirm the final price and appointment.",
    actionCopy: "No action is required from you while we review the request.",
    actionRequired: false,
    tone: "warning",
    timelineStep: 0,
    priceCertainty: "provisional",
    terminalException: false,
  },
  awaiting_customer_confirmation: {
    customerLabel: "Approval needed",
    customerTitle: "Your approval is needed",
    adminLabel: "Awaiting customer",
    customerCopy: "The booking details or price changed during review.",
    actionCopy: "Please review and approve the revised details to continue.",
    actionRequired: true,
    tone: "warning",
    timelineStep: 0,
    priceCertainty: "provisional",
    terminalException: false,
  },
  confirmed: {
    customerLabel: "Booking confirmed",
    customerTitle: "Booking confirmed",
    adminLabel: "Confirmed · unassigned",
    customerCopy: "Your appointment is confirmed. We’ll notify you when your cleaner is assigned.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "success",
    timelineStep: 1,
    priceCertainty: "firm",
    terminalException: false,
  },
  provider_assigned: {
    customerLabel: "Cleaner assigned",
    customerTitle: "Cleaner assigned",
    adminLabel: "Provider assigned",
    customerCopy: "Your cleaner has been assigned. The arrival window is shown when available.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "success",
    timelineStep: 2,
    priceCertainty: "firm",
    terminalException: false,
  },
  on_the_way: {
    customerLabel: "Cleaner on the way",
    customerTitle: "Cleaner on the way",
    adminLabel: "On the way",
    customerCopy: "Your cleaner is travelling to the property.",
    actionCopy: "Please make sure the agreed access method is available.",
    actionRequired: false,
    tone: "success",
    timelineStep: 2,
    priceCertainty: "firm",
    terminalException: false,
  },
  arrived: {
    customerLabel: "Cleaner arrived",
    customerTitle: "Cleaner arrived",
    adminLabel: "Arrived",
    customerCopy: "Your cleaner has arrived at the property.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "success",
    timelineStep: 3,
    priceCertainty: "firm",
    terminalException: false,
  },
  in_progress: {
    customerLabel: "Cleaning in progress",
    customerTitle: "Cleaning in progress",
    adminLabel: "In progress",
    customerCopy: "Cleaning is now in progress.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "success",
    timelineStep: 3,
    priceCertainty: "firm",
    terminalException: false,
  },
  completed: {
    customerLabel: "Cleaning completed",
    customerTitle: "Cleaning completed",
    adminLabel: "Completed",
    customerCopy: "The clean has been completed. Recorded completion details are shown below.",
    actionCopy: "No action is required from you.",
    actionRequired: false,
    tone: "success",
    timelineStep: 4,
    priceCertainty: "historical",
    terminalException: false,
  },
  cancelled: {
    customerLabel: "Booking cancelled",
    customerTitle: "Booking cancelled",
    adminLabel: "Cancelled",
    customerCopy: "This booking has been cancelled and will not progress further.",
    actionCopy: "Contact Quickola if you need help arranging another clean.",
    actionRequired: false,
    tone: "danger",
    timelineStep: 0,
    priceCertainty: "historical",
    terminalException: true,
  },
  unable_to_fulfil: {
    customerLabel: "Unable to fulfil",
    customerTitle: "We couldn’t fulfil this booking",
    adminLabel: "Unable to fulfil",
    customerCopy: "Quickola was unable to fulfil this booking and it will not progress further.",
    actionCopy: "Contact Quickola if you need help with another arrangement.",
    actionRequired: false,
    tone: "danger",
    timelineStep: 0,
    priceCertainty: "historical",
    terminalException: true,
  },
};

export const allowedBookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  requested: ["under_review", "confirmed", "cancelled", "unable_to_fulfil"],
  under_review: ["confirmed", "cancelled", "unable_to_fulfil"],
  awaiting_customer_confirmation: ["cancelled", "unable_to_fulfil"],
  confirmed: ["cancelled", "unable_to_fulfil"],
  provider_assigned: ["on_the_way", "confirmed", "cancelled", "unable_to_fulfil"],
  on_the_way: ["arrived", "cancelled", "unable_to_fulfil"],
  arrived: ["in_progress", "cancelled", "unable_to_fulfil"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  unable_to_fulfil: [],
};

export const customerActionStatuses: readonly BookingStatus[] = ["awaiting_customer_confirmation"];
export const activeBookingStatuses: readonly BookingStatus[] = BOOKING_STATUSES.filter(
  (status) => !["completed", "cancelled", "unable_to_fulfil"].includes(status),
);

export const CUSTOMER_TIMELINE = [
  "Booking received",
  "Booking confirmed",
  "Cleaner assigned",
  "Service in progress",
  "Completed",
] as const;

export type TimelineState = "complete" | "current" | "future";
export type TimelineItem = { label: (typeof CUSTOMER_TIMELINE)[number]; state: TimelineState };

export function isBookingStatus(value: string): value is BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus);
}
export function canTransitionBooking(from: BookingStatus, to: BookingStatus) {
  return allowedBookingTransitions[from].includes(to);
}
export function getBookingStatus(value: string): BookingPresentation {
  return isBookingStatus(value) ? bookingStatusConfig[value] : bookingStatusConfig.requested;
}
export function needsCustomerAction(value: string) {
  return getBookingStatus(value).actionRequired;
}
export function getBookingTimeline(value: string): TimelineItem[] {
  const presentation = getBookingStatus(value);
  if (presentation.terminalException) return [];
  return CUSTOMER_TIMELINE.map((label, index) => ({
    label,
    state: index < presentation.timelineStep ? "complete" : index === presentation.timelineStep ? "current" : "future",
  }));
}

export type PriceInput = {
  pricing_mode?: string | null;
  estimated_price_pence?: number | null;
  estimated_price_max_pence?: number | null;
  agreed_price_pence?: number | null;
  status?: string | null;
};
export type PricePresentation = {
  label: "Booking total" | "Estimated total" | "Revised total" | "Recorded price" | "Price pending";
  certainty: PriceCertainty;
  amountPence: number | null;
  maximumPence: number | null;
  explanation: string;
};
export function getPricePresentation(booking: PriceInput): PricePresentation {
  const status = getBookingStatus(booking.status || "requested");
  if (booking.status === "awaiting_customer_confirmation") return {label:"Revised total",certainty:"provisional",amountPence:booking.agreed_price_pence ?? booking.estimated_price_pence ?? null,maximumPence:null,explanation:"This revised total needs your approval before the appointment can be confirmed."};
  if (booking.pricing_mode === "manual_review" && booking.agreed_price_pence == null) return {label:"Estimated total",certainty:"provisional",amountPence:booking.estimated_price_pence ?? null,maximumPence:booking.estimated_price_max_pence ?? null,explanation:"This non-standard request is under review. We’ll confirm the final total before work begins."};
  const amount = booking.agreed_price_pence ?? booking.estimated_price_pence ?? null;
  if (amount == null) return {label:"Price pending",certainty:"provisional",amountPence:null,maximumPence:null,explanation:"Quickola is confirming the price for this request."};
  const exception = booking.status === "cancelled" || booking.status === "unable_to_fulfil";
  return {label:exception ? "Recorded price" : "Booking total",certainty:status.priceCertainty,amountPence:amount,maximumPence:null,explanation:booking.agreed_price_pence != null ? "This is the agreed total for the booking." : "This total was calculated from the property and service details submitted."};
}

export function cleanOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
export function formatServiceLabel(value: string) {
  const labels: Record<string, string> = {regular_cleaning:"Regular clean",deep_cleaning:"Deep clean",end_of_tenancy:"End-of-tenancy clean"};
  return labels[value] || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
export function formatRecurrenceLabel(value: string) {
  const labels: Record<string, string> = {one_off:"One-off",weekly:"Weekly",fortnightly:"Fortnightly",monthly:"Monthly"};
  return labels[value] || value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}
export function getDashboardBanner(statuses: readonly string[]) {
  const actionCount = statuses.filter(needsCustomerAction).length;
  return actionCount
    ? { actionRequired: true, title: `${actionCount} booking${actionCount === 1 ? "" : "s"} need${actionCount === 1 ? "s" : ""} your approval`, copy: "Open the booking to review and approve the revised details." }
    : { actionRequired: false, title: "Everything is on track", copy: "No action is required from you." };
}
export function getDashboardStatusCounts(statuses: readonly string[]) {
  return {
    active: statuses.filter((status) => isBookingStatus(status) && activeBookingStatuses.includes(status)).length,
    needAttention: statuses.filter(needsCustomerAction).length,
    completed: statuses.filter((status) => status === "completed").length,
  };
}
export function canShowAssignedProvider(value: string) {
  return ["provider_assigned", "on_the_way", "arrived", "in_progress", "completed"].includes(value);
}
