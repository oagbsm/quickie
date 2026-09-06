export type MarketplacePaymentBooking = {
  amount_pence?: number | null;
  refunded_amount_pence?: number | null;
  payment_status?: string | null;
  status?: string | null;
  payment_flow?: string | null;
  provider_transfer_status?: string | null;
  provider_transfer_amount_pence?: number | null;
  payout_hold_status?: string | null;
};

export type MarketplacePaymentAllocation = {
  gross_amount_pence?: number | null;
  quickola_fee_pence?: number | null;
  stripe_fee_pence?: number | null;
  provider_net_pence?: number | null;
  payout_status?: string | null;
  stripe_payout_id?: string | null;
  payout_eligible_at?: string | null;
};

export type MarketplacePaymentState = {
  flow: "platform_transfer" | "direct_charge";
  customerPaid: number;
  quickolaFee: number;
  stripeFee: number | null;
  providerNet: number | null;
  paymentLabel: "Awaiting customer payment" | "Customer paid" | "Refunded";
  payoutLabel: "Awaiting customer payment" | "Awaiting completion" | "Pending payout" | "Paid out" | "Refunded" | "Disputed";
  providerPayoutLabel: "Payment received" | "Payout scheduled" | "Payout pending" | "Payout processing" | "Paid out" | "Payout on hold";
  payoutEligibleAt: string | null;
};

export function resolveMarketplacePaymentState(
  booking: MarketplacePaymentBooking,
  allocation?: MarketplacePaymentAllocation | null,
  hasActiveDispute = false,
): MarketplacePaymentState {
  const flow = booking.payment_flow === "direct_charge" ? "direct_charge" : "platform_transfer";
  const customerPaid = Math.max(0, Number(allocation?.gross_amount_pence ?? booking.amount_pence ?? 0) - Number(booking.refunded_amount_pence || 0));
  const calculatedQuickolaFee = Math.floor(customerPaid * 10 / 100);
  const quickolaFee = flow === "direct_charge"
    ? Number(allocation?.quickola_fee_pence ?? calculatedQuickolaFee)
    : calculatedQuickolaFee;
  const stripeFee = flow === "direct_charge" && allocation?.stripe_fee_pence != null ? Number(allocation.stripe_fee_pence) : null;
  const providerNet = flow === "direct_charge"
    ? allocation?.provider_net_pence == null ? null : Number(allocation.provider_net_pence)
    : Math.max(0, customerPaid - quickolaFee);
  const refunded = booking.payment_status === "refunded" || customerPaid === 0;
  const paid = ["paid", "partially_refunded"].includes(booking.payment_status || "");
  const paymentLabel = refunded ? "Refunded" : paid ? "Customer paid" : "Awaiting customer payment";
  let payoutLabel: MarketplacePaymentState["payoutLabel"] = "Awaiting customer payment";
  if (refunded) payoutLabel = "Refunded";
  else if (hasActiveDispute || booking.payout_hold_status === "held") payoutLabel = "Disputed";
  else if (!paid) payoutLabel = "Awaiting customer payment";
  else if (flow === "direct_charge" && allocation?.payout_status === "paid") payoutLabel = "Paid out";
  else if (flow === "platform_transfer" && booking.provider_transfer_status === "paid") payoutLabel = "Paid out";
  else if (flow === "direct_charge" && allocation?.payout_status === "scheduled" && allocation.payout_eligible_at && Date.now() >= new Date(allocation.payout_eligible_at).getTime()) payoutLabel = "Pending payout";
  else if (booking.status === "completed") payoutLabel = "Pending payout";
  else payoutLabel = "Awaiting completion";
  const allocationStatus = allocation?.payout_status || "pending";
  const providerPayoutLabel = refunded || hasActiveDispute || booking.payout_hold_status === "held" ? "Payout on hold"
    : !paid ? "Payment received"
    : flow === "direct_charge" && allocationStatus === "scheduled" ? "Payout scheduled"
    : flow === "direct_charge" && allocationStatus === "processing" ? "Payout processing"
    : ((flow === "direct_charge" && allocationStatus === "paid") || (flow === "platform_transfer" && booking.provider_transfer_status === "paid")) ? "Paid out"
    : "Payout pending";
  return { flow, customerPaid, quickolaFee, stripeFee, providerNet, paymentLabel, payoutLabel, providerPayoutLabel, payoutEligibleAt: allocation?.payout_eligible_at || null };
}
