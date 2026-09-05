import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const payments = read("lib/server/marketplace-payments.ts");
const transfers = read("lib/server/marketplace-transfers.ts");
const checkout = read("app/jobs/payment-actions.ts");
const customerActions = read("app/jobs/actions.ts");
const providerActions = read("app/work/actions.ts");
const migration = read("supabase/migrations/202608300010_marketplace_delayed_provider_transfers.sql");
const completionReviewMigration = read("supabase/migrations/202609040004_marketplace_completion_review.sql");

test("commission is fixed at 10 percent with integer-pence provider settlement", () => {
  assert.match(payments, /MARKETPLACE_PLATFORM_FEE_PERCENT = 10/);
  assert.match(payments, /Math\.floor\(amountPence \* MARKETPLACE_PLATFORM_FEE_PERCENT \/ 100\)/);
  assert.match(payments, /return amountPence - platformFeePence/);
  assert.doesNotMatch(transfers, /MARKETPLACE_PLATFORM_FEE_PERCENT/);
});

test("checkout charges the full quote and does not create a destination charge", () => {
  assert.match(checkout, /unit_amount: amountPence/);
  assert.match(checkout, /platform_fee_pence: platformFeePence/);
  assert.match(checkout, /payment_intent_data: \{ transfer_group:/);
  assert.doesNotMatch(checkout, /transfer_data|application_fee_amount/);
  assert.match(checkout, /checkoutIdempotencyKey = `marketplace-booking:\$\{booking\.id\}`/);
  assert.match(checkout, /retry:\$\{existingSession\.id\}/);
  assert.match(checkout, /idempotencyKey: checkoutIdempotencyKey/);
});

test("provider transfer is gated by persisted paid completion and stored provider account", () => {
  assert.match(transfers, /payment_status === "paid"/);
  assert.match(transfers, /completion_status !== "completed"/);
  assert.match(transfers, /status !== "completed"/);
  assert.match(transfers, /provider\.stripe_account_id/);
  assert.match(transfers, /provider\.stripe_status !== "ready"/);
  assert.match(transfers, /destination: provider\.stripe_account_id/);
  assert.match(transfers, /amount: providerAmountPence/);
  assert.match(transfers, /marketplace-provider-transfer:\$\{booking\.id\}/);
});

test("completion and issue actions preserve authorization boundaries", () => {
  assert.match(customerActions, /rpc\("confirm_marketplace_completion_with_review"/);
  assert.match(customerActions, /transferMarketplaceProviderFunds\(bookingId\)/);
  assert.match(providerActions, /rpc\("update_marketplace_booking_status"/);
  assert.match(migration, /current_booking\.payment_status <> 'paid'/);
  assert.match(migration, /provider_transfer_status = 'blocked'/);
  assert.match(completionReviewMigration, /c\.auth_user_id = auth\.uid\(\)/);
});

test("transfer state persists safe retry and success identifiers", () => {
  for (const field of ["provider_transfer_status", "provider_transfer_amount_pence", "stripe_transfer_id", "provider_transferred_at", "provider_transfer_error"]) {
    assert.match(migration, new RegExp(`add column if not exists ${field}`));
  }
  assert.match(migration, /create unique index[\s\S]*stripe_transfer_id/);
  assert.match(transfers, /provider_transfer_status: "processing"/);
  assert.match(transfers, /provider_transfer_status: "paid"/);
  assert.match(transfers, /provider_transfer_status: "failed"/);
});

test("legacy provider subsystem is not used by payment settlement", () => {
  assert.doesNotMatch(transfers, /cleaner_profiles/);
});
