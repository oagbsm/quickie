export const MARKETPLACE_COMBINED_FEE_PERCENT = 10;

export type ProviderEarnings = {
  customerPaidPence: number;
  totalFeesPence: number;
  providerEarningsPence: number;
};

/** Calculate provider-facing amounts using integer minor units only. */
export function calculateProviderEarnings(amountPence: number, refundedAmountPence = 0): ProviderEarnings {
  if (!Number.isSafeInteger(amountPence) || amountPence < 0 || !Number.isSafeInteger(refundedAmountPence) || refundedAmountPence < 0) throw new Error("invalid_provider_earnings_amount");
  const customerPaidPence = Math.max(0, amountPence - Math.min(refundedAmountPence, amountPence));
  const totalFeesPence = Math.floor(customerPaidPence * MARKETPLACE_COMBINED_FEE_PERCENT / 100);
  return { customerPaidPence, totalFeesPence, providerEarningsPence: customerPaidPence - totalFeesPence };
}

export function isEligibleProviderEarnings(paymentStatus: string | null | undefined, bookingStatus: string | null | undefined, earnings: ProviderEarnings) {
  return paymentStatus === "paid" && bookingStatus === "completed" && earnings.customerPaidPence > 0;
}

export function formatProviderPayoutStatus({ paymentStatus, bookingStatus, transferStatus, payoutHoldStatus, hasActiveDispute, earnings }: { paymentStatus: string | null | undefined; bookingStatus: string | null | undefined; transferStatus: string | null | undefined; payoutHoldStatus: string | null | undefined; hasActiveDispute: boolean; earnings: ProviderEarnings }) {
  if (earnings.customerPaidPence === 0 || ["refunded", "cancelled"].includes(paymentStatus || "")) return "Refunded";
  if (payoutHoldStatus === "held" || hasActiveDispute) return "On hold";
  if (!isEligibleProviderEarnings(paymentStatus, bookingStatus, earnings)) return "Pending";
  if (transferStatus === "paid") return "Paid out";
  if (transferStatus === "processing") return "Processing";
  if (transferStatus === "blocked") return "Action required";
  return "Pending";
}
