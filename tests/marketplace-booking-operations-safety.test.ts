import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const migration = read("supabase/migrations/202609040005_marketplace_booking_operations_safety.sql");
const webhook = read("app/api/stripe/webhook/route.ts");
const refunds = read("lib/server/marketplace-refunds.ts");
const transfers = read("lib/server/marketplace-transfers.ts");
const adminActions = read("app/admin/actions.ts");
const jobActions = read("app/jobs/actions.ts");

test("Stripe webhook events are uniquely claimed and retryable after failure", () => {
  assert.match(migration, /stripe_event_id text not null unique/);
  assert.match(migration, /claim_stripe_webhook_event/);
  assert.match(migration, /on conflict \(stripe_event_id\) do nothing/);
  assert.match(migration, /status = 'failed'/);
  assert.match(webhook, /claim_stripe_webhook_event/);
  assert.match(webhook, /duplicate_processing/);
  assert.match(webhook, /status: "processed"/);
});

test("refunds are reserved, bounded, Stripe-idempotent, and persisted", () => {
  assert.match(migration, /marketplace_refunds/);
  assert.match(migration, /stripe_refund_id text unique/);
  assert.match(migration, /marketplace_refunds_one_pending_idx/);
  assert.match(refunds, /refunded_amount_pence/);
  assert.match(refunds, /refund_amount_invalid/);
  assert.match(refunds, /marketplace-refund:\$\{inserted\.data\.id\}/);
  assert.match(refunds, /refunds\.create/);
  assert.match(adminActions, /issueMarketplaceBookingRefund/);
});

test("cancellation and disputes are server-authoritative and hold payout", () => {
  assert.match(migration, /cancel_marketplace_booking/);
  assert.match(migration, /cancellation_reason_required/);
  assert.match(migration, /booking_not_cancellable/);
  assert.match(migration, /payout_hold_status = 'held'/);
  assert.match(migration, /open_marketplace_dispute/);
  assert.match(migration, /marketplace_disputes_one_active_per_booking_idx/);
  assert.match(migration, /unresolved_dispute/);
  assert.match(adminActions, /cancelMarketplaceBookingAsAdmin/);
  assert.match(adminActions, /resolveMarketplaceDispute/);
});

test("provider payout is blocked by cancellation, refund, or operational hold", () => {
  assert.match(transfers, /payout_hold_status === "held"/);
  assert.match(transfers, /refunded_amount_pence/);
  assert.match(transfers, /payment_status !== "paid"/);
  assert.match(transfers, /marketplace-provider-transfer:\$\{booking\.id\}/);
  assert.match(transfers, /marketplace_disputes/);
  assert.match(transfers, /booking_dispute_lookup_failed/);
});

test("ambiguous provider transfers reconcile from Stripe without unsafe recreation", () => {
  assert.match(transfers, /reconcileMarketplaceProviderTransfer/);
  assert.match(transfers, /transfers\.list/);
  assert.match(transfers, /if \(!matching\) return \{ status: "already_processing" \}/);
  assert.match(adminActions, /reconcileMarketplaceBookingTransfer/);
});

test("completion review is atomic and problem reports require the protected dispute path", () => {
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /add column if not exists completed_at/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /payout_hold_status = 'held'/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /review_already_submitted/);
  assert.match(read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql"), /marketplace_disputes/);
  assert.match(jobActions, /reason_text: reasonText/);
  assert.match(jobActions, /reportMarketplaceCompletionIssue/);
});

test("refund persistence failures do not convert an ambiguous Stripe result into a second attempt", () => {
  assert.match(refunds, /Stripe refund succeeded but its audit row could not be updated/);
  assert.match(refunds, /Refund recorded but booking payment state could not be updated/);
  assert.match(refunds, /status: "already_processing", refundId: refund\.id/);
});
