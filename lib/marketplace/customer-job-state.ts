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
  if (booking?.payment_status === "paid") return "booked";
  if (booking?.stripe_checkout_session_id) return "payment_processing";
  return "payment_required";
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
