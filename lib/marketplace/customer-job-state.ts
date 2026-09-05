export type CustomerJobState =
  | "waiting_offers"
  | "offers_received"
  | "payment_required"
  | "payment_processing"
  | "booked";

export const ACTIVE_MARKETPLACE_OFFER_STATUSES = ["pending", "submitted", "selected", "accepted"] as const;

export function getMarketplaceQuoteProviderId(quote: { provider_id?: string | null; bidder_user_id?: string | null } | null | undefined) {
  return quote?.provider_id || quote?.bidder_user_id || null;
}

type QuoteSnapshot = {
  status?: string | null;
};

type BookingSnapshot = {
  amount_pence?: number | null;
  refunded_amount_pence?: number | null;
  payment_status?: string | null;
  stripe_checkout_session_id?: string | null;
};

export type MarketplacePaymentState = "none" | "payment_required" | "payment_processing" | "paid";
export type CustomerJobLifecycleState = "waiting_for_offers" | "offers_received" | "provider_selected_unpaid" | "payment_pending" | "refund_pending" | "partially_refunded" | "refunded" | "booked" | "provider_on_the_way" | "provider_arrived" | "awaiting_customer_completion" | "completion_issue_reported" | "completed" | "cancelled";

type LifecycleBookingSnapshot = BookingSnapshot & { status?: string | null; completion_status?: string | null; payout_hold_status?: string | null; payout_hold_reason?: string | null };

export type MarketplaceBookingLifecycleState = "payment_required" | "refund_pending" | "refunded" | "booked" | "provider_on_the_way" | "provider_arrived" | "issue_being_reviewed" | "awaiting_customer_completion" | "completed" | "cancelled";

export function isPartialMarketplaceRefund(booking: { amount_pence?: number | null; refunded_amount_pence?: number | null; payment_status?: string | null } | null | undefined) {
  const amount = Number(booking?.amount_pence || 0);
  const refunded = Number(booking?.refunded_amount_pence || 0);
  return booking?.payment_status !== "refunded" && amount > 0 && refunded > 0 && refunded < amount;
}

export function isDisputeControlledPayoutHold(booking: { payout_hold_status?: string | null; payout_hold_reason?: string | null } | null | undefined, hasActiveDispute = false) {
  return booking?.payout_hold_status === "held" && (hasActiveDispute || ["unresolved_dispute", "customer_issue_reported", "customer_resolution_refund"].includes(booking.payout_hold_reason || ""));
}

export function getMarketplaceBookingLifecycleState(booking: LifecycleBookingSnapshot | null | undefined, hasActiveDispute = false): MarketplaceBookingLifecycleState {
  if (!booking) return "payment_required";
  if (booking?.status === "cancelled") return "cancelled";
  if (booking?.payment_status === "refunded") return "refunded";
  if (booking?.payment_status === "refund_pending") return "refund_pending";
  if (getMarketplacePaymentState(booking) !== "paid") return "payment_required";
  if (hasActiveDispute || booking.completion_status === "issue_reported" || (booking.payout_hold_status === "held" && booking.payout_hold_reason === "unresolved_dispute")) return "issue_being_reviewed";
  if (isPartialMarketplaceRefund(booking)) return "booked";
  if (booking.completion_status === "completed" || booking.status === "completed") return "completed";
  if (booking.status === "awaiting_customer_completion" || booking.completion_status === "awaiting_customer_completion") return "awaiting_customer_completion";
  if (booking.status === "arrived" || booking.status === "in_progress") return "provider_arrived";
  if (booking.status === "en_route") return "provider_on_the_way";
  return "booked";
}

export function getMarketplaceBookingLifecycleLabel(state: MarketplaceBookingLifecycleState) {
  return { payment_required: "Payment required", refund_pending: "Refund processing", refunded: "Refunded", booked: "Booked", provider_on_the_way: "On the way", provider_arrived: "In progress", issue_being_reviewed: "Issue being reviewed", awaiting_customer_completion: "Awaiting customer completion", completed: "Completed", cancelled: "Cancelled" }[state];
}

export function getCustomerJobLifecycleState({ offerCount, acceptedQuote, booking, hasActiveDispute = false }: { offerCount: number; acceptedQuote?: QuoteSnapshot | null; booking?: LifecycleBookingSnapshot | null; hasActiveDispute?: boolean }): CustomerJobLifecycleState {
  if (!acceptedQuote) return offerCount > 0 ? "offers_received" : "waiting_for_offers";
  if (booking?.status === "cancelled") return "cancelled";
  if (booking?.payment_status === "refunded") return "refunded";
  if (booking?.payment_status === "refund_pending") return "refund_pending";
  const paymentState = getMarketplacePaymentState(booking);
  if (paymentState !== "paid") return paymentState === "payment_processing" ? "payment_pending" : "provider_selected_unpaid";
  if (hasActiveDispute || booking?.completion_status === "issue_reported" || (booking?.payout_hold_status === "held" && booking?.payout_hold_reason === "unresolved_dispute")) return "completion_issue_reported";
  if (isPartialMarketplaceRefund(booking)) return "partially_refunded";
  if (booking?.completion_status === "completed" || booking?.status === "completed") return "completed";
  if (booking?.status === "awaiting_customer_completion" && booking?.completion_status === "awaiting_customer_completion") return "awaiting_customer_completion";
  if (booking?.status === "arrived" || booking?.status === "in_progress") return "provider_arrived";
  if (booking?.status === "en_route") return "provider_on_the_way";
  return "booked";
}

export function getCustomerJobLifecycleLabel(state: CustomerJobLifecycleState) {
  return { waiting_for_offers: "Waiting", offers_received: "Offers", provider_selected_unpaid: "Pay now", payment_pending: "Confirming", refund_pending: "Refund processing", partially_refunded: "Partial refund", refunded: "Refunded", booked: "Booked", provider_on_the_way: "On the way", provider_arrived: "In progress", awaiting_customer_completion: "Confirm completion", completion_issue_reported: "Issue reported", completed: "Completed", cancelled: "Cancelled" }[state];
}

export function normalizeMarketplaceRelation<T>(relation: T | T[] | null | undefined): T[] {
  if (relation == null) return [];
  return Array.isArray(relation) ? relation : [relation];
}

export function getMarketplacePaymentState(booking?: BookingSnapshot | null): MarketplacePaymentState {
  if (!booking) return "none";
  if (["paid", "partially_refunded"].includes(booking.payment_status || "")) return "paid";
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
