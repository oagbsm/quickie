import { calculateProviderEarnings } from "./provider-earnings.ts";

export type AdminFinanceBooking = {
  id: string;
  job_id: string;
  amount_pence?: number | null;
  refunded_amount_pence?: number | null;
  payment_status?: string | null;
  status?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  provider_transfer_status?: string | null;
  provider_transfer_amount_pence?: number | null;
  provider_transferred_at?: string | null;
  payout_hold_status?: string | null;
  payout_hold_reason?: string | null;
  stripe_payment_intent_id?: string | null;
  stripe_transfer_id?: string | null;
  marketplace_jobs?: { service?: string | null; service_subtype?: string | null; postcode?: string | null } | null;
  marketplace_customers?: { display_name?: string | null; email?: string | null } | null;
  marketplace_providers?: { display_name?: string | null; business_name?: string | null; user_id?: string | null } | null;
};

export type AdminFinanceRefund = {
  id: string;
  booking_id: string;
  amount_pence: number;
  status: string;
  stripe_refund_id?: string | null;
  stripe_payment_intent_id?: string | null;
  created_at: string;
  confirmed_at?: string | null;
  failure_reason?: string | null;
};

export type FinanceEventType = "payment" | "refund" | "transfer" | "hold";
export type FinanceEvent = {
  id: string;
  bookingId: string;
  date: string;
  type: FinanceEventType;
  amountPence: number;
  direction: "in" | "out";
  status: string;
  reference?: string | null;
  booking: AdminFinanceBooking;
  refund?: AdminFinanceRefund;
};

const paymentStates = new Set(["paid", "partially_refunded", "refund_pending", "refunded"]);
const successfulRefund = (refund: AdminFinanceRefund) => refund.status === "succeeded";

export function bookingNetPaidPence(booking: AdminFinanceBooking, refunds: AdminFinanceRefund[] = []) {
  const recordedRefunds = refunds.filter(successfulRefund).reduce((sum, refund) => sum + Number(refund.amount_pence || 0), 0);
  const persistedRefunds = Number(booking.refunded_amount_pence || 0);
  return Math.max(0, Number(booking.amount_pence || 0) - Math.max(recordedRefunds, persistedRefunds));
}

export function bookingIsPaid(booking: AdminFinanceBooking) {
  return paymentStates.has(booking.payment_status || "") && Boolean(booking.paid_at);
}

export function bookingFinancialBreakdown(booking: AdminFinanceBooking, refunds: AdminFinanceRefund[] = []) {
  const originalPence = Number(booking.amount_pence || 0);
  const refundPence = Math.max(
    Number(booking.refunded_amount_pence || 0),
    refunds.filter(successfulRefund).reduce((sum, refund) => sum + Number(refund.amount_pence || 0), 0),
  );
  const netPence = Math.max(0, originalPence - Math.min(refundPence, originalPence));
  const earnings = calculateProviderEarnings(originalPence, refundPence);
  const transferredPence = booking.provider_transfer_status === "paid"
    ? Number(booking.provider_transfer_amount_pence || earnings.providerEarningsPence)
    : 0;
  return { originalPence, refundPence, netPence, feePence: earnings.totalFeesPence, providerEarningsPence: earnings.providerEarningsPence, transferredPence };
}

export function bookingFinancialStatus(booking: AdminFinanceBooking, refunds: AdminFinanceRefund[] = []) {
  const breakdown = bookingFinancialBreakdown(booking, refunds);
  const refundTotal = refunds.filter(successfulRefund).reduce((sum, refund) => sum + Number(refund.amount_pence || 0), 0);
  const mismatch = Number(booking.refunded_amount_pence || 0) > Number(booking.amount_pence || 0)
    || refundTotal > Number(booking.amount_pence || 0)
    || breakdown.transferredPence > breakdown.providerEarningsPence;
  return mismatch ? "Financial mismatch" : "Balanced";
}

export function financialEvents(bookings: AdminFinanceBooking[], refunds: AdminFinanceRefund[]): FinanceEvent[] {
  const refundsByBooking = new Map<string, AdminFinanceRefund[]>();
  for (const refund of refunds) refundsByBooking.set(refund.booking_id, [...(refundsByBooking.get(refund.booking_id) || []), refund]);
  const events: FinanceEvent[] = [];
  for (const booking of bookings) {
    const bookingRefunds = refundsByBooking.get(booking.id) || [];
    if (bookingIsPaid(booking)) {
      events.push({ id: `payment:${booking.id}`, bookingId: booking.id, date: booking.paid_at || booking.created_at, type: "payment", amountPence: Number(booking.amount_pence || 0), direction: "in", status: booking.payment_status === "refunded" ? "Fully refunded" : booking.payment_status === "partially_refunded" ? "Partially refunded" : "Paid", reference: booking.stripe_payment_intent_id, booking });
    }
    for (const refund of bookingRefunds) {
      events.push({ id: `refund:${refund.id}`, bookingId: booking.id, date: refund.confirmed_at || refund.created_at, type: "refund", amountPence: Number(refund.amount_pence || 0), direction: "out", status: refund.status, reference: refund.stripe_refund_id || refund.id, booking, refund });
    }
    if (["processing", "failed", "paid"].includes(booking.provider_transfer_status || "")) {
      const breakdown = bookingFinancialBreakdown(booking, bookingRefunds);
      events.push({ id: `transfer:${booking.id}:${booking.provider_transfer_status}`, bookingId: booking.id, date: booking.provider_transferred_at || booking.updated_at || booking.created_at, type: "transfer", amountPence: Number(booking.provider_transfer_amount_pence || breakdown.providerEarningsPence), direction: "out", status: booking.provider_transfer_status || "unknown", reference: booking.stripe_transfer_id, booking });
    }
    if (booking.payout_hold_status === "held") {
      const breakdown = bookingFinancialBreakdown(booking, bookingRefunds);
      events.push({ id: `hold:${booking.id}`, bookingId: booking.id, date: booking.updated_at || booking.created_at, type: "hold", amountPence: breakdown.providerEarningsPence, direction: "out", status: "On hold", reference: booking.payout_hold_reason, booking });
    }
  }
  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function financialSummary(bookings: AdminFinanceBooking[], refunds: AdminFinanceRefund[]) {
  const refundsByBooking = new Map<string, AdminFinanceRefund[]>();
  for (const refund of refunds) refundsByBooking.set(refund.booking_id, [...(refundsByBooking.get(refund.booking_id) || []), refund]);
  let grossPence = 0;
  let refundedPence = 0;
  let revenuePence = 0;
  let providerEarningsPence = 0;
  let pendingProviderPence = 0;
  let transferredPence = 0;
  let onHoldPence = 0;
  let mismatches = 0;
  for (const booking of bookings) {
    if (!bookingIsPaid(booking)) continue;
    const bookingRefunds = refundsByBooking.get(booking.id) || [];
    const breakdown = bookingFinancialBreakdown(booking, bookingRefunds);
    grossPence += breakdown.originalPence;
    refundedPence += bookingRefunds.filter(successfulRefund).reduce((sum, refund) => sum + Number(refund.amount_pence || 0), 0);
    revenuePence += breakdown.feePence;
    providerEarningsPence += breakdown.providerEarningsPence;
    if (booking.provider_transfer_status === "paid") transferredPence += breakdown.transferredPence;
    else if (booking.payout_hold_status === "held") onHoldPence += breakdown.providerEarningsPence;
    else if (!["refunded", "cancelled"].includes(booking.payment_status || "")) pendingProviderPence += breakdown.providerEarningsPence;
    if (bookingFinancialStatus(booking, bookingRefunds) !== "Balanced") mismatches += 1;
  }
  return { grossPence, refundedPence, netPence: Math.max(0, grossPence - refundedPence), revenuePence, providerEarningsPence, pendingProviderPence, transferredPence, onHoldPence, mismatches };
}

export function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
