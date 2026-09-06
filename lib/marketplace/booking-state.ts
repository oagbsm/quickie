import { getMarketplaceBookingLifecycleLabel, getMarketplaceBookingLifecycleState, getMarketplacePaymentState, type MarketplaceBookingLifecycleState, type MarketplacePaymentState } from "@/lib/marketplace/customer-job-state";

export type MarketplaceStateQuote = { id: string; provider_id?: string | null; bidder_user_id?: string | null; status?: string | null };
export type MarketplaceStateBooking = { provider_id?: string | null; quote_id?: string | null; payment_status?: string | null; status?: string | null; completion_status?: string | null; cancelled_at?: string | null };
export type MarketplaceStateJob = { status?: string | null };

export type MarketplaceQuoteState = "CURRENT_SELECTED" | "BOOKED_PROVIDER" | "NOT_SELECTED" | "WITHDRAWN" | "EXPIRED";
export type MarketplaceResolvedState = {
  currentProviderId: string | null;
  currentQuoteId: string | null;
  paymentState: MarketplacePaymentState;
  bookingState: MarketplaceBookingLifecycleState;
  canCustomerPay: boolean;
  canCustomerSwitchProvider: boolean;
  canCustomerCancel: boolean;
  canProviderComplete: boolean;
  customerFacingStatus: string;
  providerFacingStatus: string;
  quoteState: (quote: MarketplaceStateQuote, viewerProviderId?: string | null) => MarketplaceQuoteState;
};

export function getMarketplaceQuoteProviderIdForState(quote: MarketplaceStateQuote) {
  return quote.provider_id || quote.bidder_user_id || null;
}

export function resolveMarketplaceJobState({ job, booking, quotes, viewerProviderId = null, hasActiveDispute = false }: { job?: MarketplaceStateJob | null; booking?: MarketplaceStateBooking | null; quotes: MarketplaceStateQuote[]; viewerProviderId?: string | null; hasActiveDispute?: boolean }): MarketplaceResolvedState {
  const acceptedQuote = quotes.find((quote) => ["accepted", "selected"].includes(quote.status || ""));
  const currentProviderId = booking?.provider_id || getMarketplaceQuoteProviderIdForState(acceptedQuote || { id: "", status: null });
  const currentQuoteId = booking?.quote_id || acceptedQuote?.id || null;
  const bookingState = getMarketplaceBookingLifecycleState(booking, hasActiveDispute);
  const paymentState = getMarketplacePaymentState(booking);
  const terminal = job?.status === "cancelled" || job?.status === "completed" || booking?.status === "cancelled" || booking?.status === "completed";
  const paid = paymentState === "paid";
  const selectedUnpaid = Boolean(booking && !paid && !terminal && bookingState === "payment_required");
  const quoteState = (quote: MarketplaceStateQuote, providerId = viewerProviderId): MarketplaceQuoteState => {
    const quoteProviderId = getMarketplaceQuoteProviderIdForState(quote);
    if (quote.status === "withdrawn") return "WITHDRAWN";
    if (quote.status === "expired") return "EXPIRED";
    if (booking && quote.id === booking.quote_id && quoteProviderId === booking.provider_id) return paid ? "BOOKED_PROVIDER" : "CURRENT_SELECTED";
    if (providerId && quoteProviderId !== providerId) return "NOT_SELECTED";
    return currentQuoteId === quote.id ? (paid ? "BOOKED_PROVIDER" : "CURRENT_SELECTED") : "NOT_SELECTED";
  };
  const viewerIsCurrent = !viewerProviderId || viewerProviderId === currentProviderId;
  return {
    currentProviderId,
    currentQuoteId,
    paymentState,
    bookingState,
    canCustomerPay: selectedUnpaid && viewerIsCurrent,
    canCustomerSwitchProvider: Boolean(booking && !paid && !terminal),
    canCustomerCancel: Boolean(booking && !paid && !terminal),
    canProviderComplete: Boolean(booking && paid && viewerIsCurrent && !terminal && bookingState === "booked"),
    customerFacingStatus: getMarketplaceBookingLifecycleLabel(bookingState),
    providerFacingStatus: paid && viewerIsCurrent ? getMarketplaceBookingLifecycleLabel(bookingState) : quoteState(quotes.find((quote) => getMarketplaceQuoteProviderIdForState(quote) === viewerProviderId) || { id: "", status: null }, viewerProviderId) === "NOT_SELECTED" ? "Not selected" : "Awaiting customer payment",
    quoteState,
  };
}
