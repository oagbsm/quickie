import assert from "node:assert/strict";
import test from "node:test";
import { getCustomerJobLifecycleState, getMarketplaceBookingLifecycleLabel, getMarketplaceBookingLifecycleState } from "../lib/marketplace/customer-job-state.ts";

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
