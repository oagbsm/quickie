import assert from "node:assert/strict";
import test from "node:test";
import { bookingFinancialBreakdown, bookingFinancialStatus, financialEvents, financialSummary } from "../lib/marketplace/admin-finance.ts";
import { resolveMarketplacePaymentState } from "../lib/marketplace/payment-state.ts";

const booking = (overrides: Record<string, unknown> = {}) => ({
  id: "booking-1", job_id: "job-1", amount_pence: 26600, refunded_amount_pence: 5000,
  payment_status: "partially_refunded", status: "completed", paid_at: "2026-09-01T10:00:00Z",
  created_at: "2026-09-01T09:00:00Z", updated_at: "2026-09-05T14:02:00Z",
  provider_transfer_status: "paid", provider_transfer_amount_pence: 19440,
  provider_transferred_at: "2026-09-05T14:02:00Z", payout_hold_status: "none",
  stripe_payment_intent_id: "pi_123", stripe_transfer_id: "tr_123", ...overrides,
});

test("financial breakdown uses net paid value and integer-pence fee", () => {
  const result = bookingFinancialBreakdown(booking(), [{ id: "refund-1", booking_id: "booking-1", amount_pence: 5000, status: "succeeded", created_at: "2026-09-05T13:10:00Z" }]);
  assert.deepEqual(result, { originalPence: 26600, refundPence: 5000, netPence: 21600, feePence: 2160, providerEarningsPence: 19440, transferredPence: 19440 });
  assert.equal(bookingFinancialStatus(booking(), []), "Balanced");
});

test("full refund produces zero current fee and provider earnings", () => {
  const full = booking({ refunded_amount_pence: 26600, payment_status: "refunded", provider_transfer_status: "blocked", provider_transfer_amount_pence: 0, stripe_transfer_id: null });
  const result = bookingFinancialBreakdown(full, [{ id: "refund-1", booking_id: "booking-1", amount_pence: 26600, status: "succeeded", created_at: "2026-09-05T13:10:00Z" }]);
  assert.equal(result.netPence, 0);
  assert.equal(result.feePence, 0);
  assert.equal(result.providerEarningsPence, 0);
});

test("ledger emits separate payment, each refund, transfer and hold events without duplicate payments", () => {
  const refunds = [
    { id: "refund-1", booking_id: "booking-1", amount_pence: 3000, status: "succeeded", stripe_refund_id: "re_1", created_at: "2026-09-04T13:10:00Z" },
    { id: "refund-2", booking_id: "booking-1", amount_pence: 2000, status: "succeeded", stripe_refund_id: "re_2", created_at: "2026-09-05T13:10:00Z" },
  ];
  const events = financialEvents([booking({ payout_hold_status: "held", provider_transfer_status: "pending", stripe_transfer_id: null })], refunds);
  assert.deepEqual(events.map((event) => event.type).sort(), ["hold", "payment", "refund", "refund"]);
  assert.equal(new Set(events.map((event) => event.id)).size, events.length);
});

test("financial summary counts pending, held and transferred provider amounts", () => {
  const summary = financialSummary([
    booking(),
    booking({ id: "booking-2", job_id: "job-2", amount_pence: 10000, refunded_amount_pence: 0, payment_status: "paid", provider_transfer_status: "pending", provider_transfer_amount_pence: 9000, provider_transferred_at: null }),
    booking({ id: "booking-3", job_id: "job-3", amount_pence: 5000, refunded_amount_pence: 0, payment_status: "paid", provider_transfer_status: "blocked", provider_transfer_amount_pence: 4500, payout_hold_status: "held", provider_transferred_at: null }),
  ], [{ id: "refund-1", booking_id: "booking-1", amount_pence: 5000, status: "succeeded", created_at: "2026-09-05T13:10:00Z" }]);
  assert.equal(summary.grossPence, 41600);
  assert.equal(summary.refundedPence, 5000);
  assert.equal(summary.netPence, 36600);
  assert.equal(summary.revenuePence, 3660);
  assert.equal(summary.transferredPence, 19440);
  assert.equal(summary.pendingProviderPence, 9000);
  assert.equal(summary.onHoldPence, 4500);
});

test("financial mismatch is read-only and detects impossible transfer/refund relationships", () => {
  const invalid = booking({ provider_transfer_amount_pence: 30000 });
  assert.equal(bookingFinancialStatus(invalid, []), "Financial mismatch");
  const invalidRefund = booking({ refunded_amount_pence: 30000 });
  assert.equal(bookingFinancialStatus(invalidRefund, []), "Financial mismatch");
});

test("payment state resolves a direct charge from its persisted allocation", () => {
  const state = resolveMarketplacePaymentState(
    { amount_pence: 10000, payment_status: "paid", status: "booked", payment_flow: "direct_charge" },
    { gross_amount_pence: 10000, quickola_fee_pence: 1000, stripe_fee_pence: 335, provider_net_pence: 8665, payout_status: "pending" },
  );
  assert.deepEqual(state, { flow: "direct_charge", customerPaid: 10000, quickolaFee: 1000, stripeFee: 335, providerNet: 8665, paymentLabel: "Customer paid", payoutLabel: "Awaiting completion" });
});

test("payment state does not invent a Stripe fee for platform transfers", () => {
  const state = resolveMarketplacePaymentState({ amount_pence: 30000, payment_status: "paid", status: "completed", payment_flow: "platform_transfer", provider_transfer_status: "paid" });
  assert.equal(state.stripeFee, null);
  assert.equal(state.providerNet, 27000);
  assert.equal(state.payoutLabel, "Paid out");
});
