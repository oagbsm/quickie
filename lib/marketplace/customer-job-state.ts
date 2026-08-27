export type CustomerJobState =
  | "waiting_offers"
  | "offers_received"
  | "payment_required"
  | "payment_processing"
  | "booked";

type QuoteSnapshot = {
  status?: string | null;
};

type BookingSnapshot = {
  payment_status?: string | null;
  stripe_checkout_session_id?: string | null;
};

export type MarketplacePaymentState = "none" | "payment_required" | "payment_processing" | "paid";
export type CustomerJobLifecycleState = "waiting_for_offers" | "offers_received" | "provider_selected_unpaid" | "payment_pending" | "booked" | "provider_on_the_way" | "provider_arrived" | "awaiting_customer_completion" | "completed" | "cancelled";

type LifecycleBookingSnapshot = BookingSnapshot & { status?: string | null; completion_status?: string | null };

export function getCustomerJobLifecycleState({ offerCount, acceptedQuote, booking }: { offerCount: number; acceptedQuote?: QuoteSnapshot | null; booking?: LifecycleBookingSnapshot | null }): CustomerJobLifecycleState {
  if (!acceptedQuote) return offerCount > 0 ? "offers_received" : "waiting_for_offers";
  const paymentState = getMarketplacePaymentState(booking);
  if (paymentState !== "paid") return paymentState === "payment_processing" ? "payment_pending" : "provider_selected_unpaid";
  if (booking?.status === "cancelled") return "cancelled";
  if (booking?.completion_status === "completed" || booking?.status === "completed") return "completed";
  if (booking?.status === "awaiting_customer_completion") return "awaiting_customer_completion";
  if (booking?.status === "arrived" || booking?.status === "in_progress") return "provider_arrived";
  if (booking?.status === "en_route") return "provider_on_the_way";
  return "booked";
}

export function getCustomerJobLifecycleLabel(state: CustomerJobLifecycleState) {
  return { waiting_for_offers: "Waiting", offers_received: "Offers", provider_selected_unpaid: "Pay now", payment_pending: "Confirming", booked: "Booked", provider_on_the_way: "On the way", provider_arrived: "In progress", awaiting_customer_completion: "Confirm job", completed: "Completed", cancelled: "Cancelled" }[state];
}

export function normalizeMarketplaceRelation<T>(relation: T | T[] | null | undefined): T[] {
  if (relation == null) return [];
  return Array.isArray(relation) ? relation : [relation];
}

export function getMarketplacePaymentState(booking?: BookingSnapshot | null): MarketplacePaymentState {
  if (!booking) return "none";
  if (booking.payment_status === "paid") return "paid";
  if (booking.stripe_checkout_session_id) return "payment_processing";
  return "payment_required";
}

export function getCustomerJobState({
  offerCount,
  acceptedQuote,
  booking,
}: {
  offerCount: number;
  acceptedQuote?: QuoteSnapshot | null;
  booking?: BookingSnapshot | null;
}): CustomerJobState {
  if (!acceptedQuote) return offerCount > 0 ? "offers_received" : "waiting_offers";
  const paymentState = getMarketplacePaymentState(booking);
  if (paymentState === "paid") return "booked";
  if (paymentState === "payment_processing") return "payment_processing";
  if (paymentState === "payment_required") return "payment_required";
  return "offers_received";
}

export function getCustomerJobStatusLabel(state: CustomerJobState) {
  return {
    waiting_offers: "Waiting for offers",
    offers_received: "Offers received",
    payment_required: "Payment required",
    payment_processing: "Payment processing",
    booked: "Booked",
  }[state];
}

export function formatMarketplaceAmount(amountPence: number | null | undefined) {
  if (!Number.isFinite(Number(amountPence))) return "£0";
  return `£${Math.round(Number(amountPence) / 100)}`;
}

export function formatMarketplaceSchedule(item: {
  scheduled_date?: string | null;
  arrival_window_start?: string | null;
  arrival_window_end?: string | null;
  availability_text?: string | null;
} | null | undefined) {
  if (!item?.scheduled_date) {
    return {
      dateLabel: null,
      timeLabel: item?.availability_text || "Time awaiting confirmation",
    };
  }

  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${item.scheduled_date}T12:00:00`));
  const timeLabel = item.arrival_window_start
    ? `${item.arrival_window_start}${item.arrival_window_end ? `–${item.arrival_window_end}` : ""}`
    : "Time awaiting confirmation";

  return { dateLabel, timeLabel };
}
