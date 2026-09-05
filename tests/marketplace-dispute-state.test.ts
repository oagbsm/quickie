import assert from "node:assert/strict";
import test from "node:test";
import { getCustomerJobLifecycleState, getMarketplaceBookingLifecycleLabel, getMarketplaceBookingLifecycleState, getMarketplacePaymentState, isPartialMarketplaceRefund } from "../lib/marketplace/customer-job-state.ts";

const quote = { status: "accepted" };

test("paid open completion issue is paused consistently without becoming payment required", () => {
  const booking = { payment_status: "paid", status: "awaiting_customer_completion", completion_status: "issue_reported", payout_hold_status: "held", payout_hold_reason: "unresolved_dispute" };
  assert.equal(getCustomerJobLifecycleState({ offerCount: 1, acceptedQuote: quote, booking }), "completion_issue_reported");
  assert.equal(getMarketplaceBookingLifecycleState(booking, true), "issue_being_reviewed");
  assert.notEqual(getMarketplaceBookingLifecycleState(booking, true), "payment_required");
});

test("continued paid booking returns to customer completion across surfaces", () => {
  const booking = { payment_status: "paid", status: "awaiting_customer_completion", completion_status: "awaiting_customer_completion", payout_hold_status: "none", payout_hold_reason: null };
  assert.equal(getCustomerJobLifecycleState({ offerCount: 1, acceptedQuote: quote, booking }), "awaiting_customer_completion");
  assert.equal(getMarketplaceBookingLifecycleState(booking), "awaiting_customer_completion");
  assert.equal(getMarketplaceBookingLifecycleLabel("awaiting_customer_completion"), "Awaiting customer completion");
});

test("unrelated manual hold remains a hold and is not misclassified as a dispute", () => {
  const booking = { payment_status: "paid", status: "awaiting_customer_completion", completion_status: "awaiting_customer_completion", payout_hold_status: "held", payout_hold_reason: "manual_review" };
  assert.equal(getCustomerJobLifecycleState({ offerCount: 1, acceptedQuote: quote, booking }), "awaiting_customer_completion");
  assert.equal(getMarketplaceBookingLifecycleState(booking), "awaiting_customer_completion");
});

test("paid bookings never derive payment required from lifecycle status", () => {
  for (const status of ["booked", "en_route", "arrived", "in_progress", "awaiting_customer_completion"]) {
    assert.notEqual(getMarketplaceBookingLifecycleState({ payment_status: "paid", status }), "payment_required");
  }
});

test("partial refunds remain paid and an open issue takes lifecycle precedence", () => {
  const booking = { amount_pence: 26600, refunded_amount_pence: 5000, payment_status: "paid", status: "awaiting_customer_completion", completion_status: "issue_reported", payout_hold_status: "held", payout_hold_reason: "unresolved_dispute" };
  assert.equal(isPartialMarketplaceRefund(booking), true);
  assert.equal(getMarketplacePaymentState(booking), "paid");
  assert.equal(getCustomerJobLifecycleState({ offerCount: 1, acceptedQuote: quote, booking, hasActiveDispute: true }), "completion_issue_reported");
  assert.equal(getMarketplaceBookingLifecycleState(booking, true), "issue_being_reviewed");
  assert.notEqual(getCustomerJobLifecycleState({ offerCount: 1, acceptedQuote: quote, booking, hasActiveDispute: true }), "provider_selected_unpaid");
  assert.notEqual(getMarketplaceBookingLifecycleState(booking, true), "payment_required");
});

test("partial refund amount is remaining paid amount and full refund stays distinct", () => {
  const partial = { amount_pence: 26600, refunded_amount_pence: 5000, payment_status: "paid" };
  const full = { amount_pence: 26600, refunded_amount_pence: 26600, payment_status: "refunded" };
  assert.equal(partial.amount_pence - partial.refunded_amount_pence, 21600);
  assert.equal(isPartialMarketplaceRefund(partial), true);
  assert.equal(isPartialMarketplaceRefund(full), false);
  assert.equal(getMarketplaceBookingLifecycleState(full), "refunded");
  assert.equal(getMarketplacePaymentState({ payment_status: "paid" }), "paid");
});
