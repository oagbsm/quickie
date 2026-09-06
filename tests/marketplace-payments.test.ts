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
const checkoutRaceMigration = read("supabase/migrations/20260906085033_marketplace_checkout_attempt_race_safety.sql");
const directChargeMigration = read("supabase/migrations/20260906090346_marketplace_direct_charge_mixed_mode.sql");
const providerStripe = read("lib/server/provider-stripe.ts");
const directWebhooks = read("lib/server/marketplace-direct-charge-webhooks.ts");
const directPayouts = read("lib/server/marketplace-direct-payouts.ts");
const payoutScheduleMigration = read("supabase/migrations/20260906130000_marketplace_direct_charge_payout_schedule.sql");
const payoutAvailabilityMigration = read("supabase/migrations/20260906150000_direct_charge_balance_availability.sql");

test("commission is fixed at 10 percent with integer-pence provider settlement", () => {
  assert.match(payments, /MARKETPLACE_PLATFORM_FEE_PERCENT = 10/);
  assert.match(payments, /Math\.floor\(amountPence \* MARKETPLACE_PLATFORM_FEE_PERCENT \/ 100\)/);
  assert.match(payments, /return amountPence - platformFeePence/);
  assert.doesNotMatch(transfers, /MARKETPLACE_PLATFORM_FEE_PERCENT/);
});

test("checkout charges the full quote and does not create a destination charge", () => {
  assert.match(checkout, /unit_amount: amountPence/);
  assert.match(checkout, /platform_fee_pence: platformFeePence/);
  assert.match(checkout, /payment_intent_data: booking\.payment_flow === "direct_charge"/);
  assert.doesNotMatch(checkout, /transfer_data/);
  assert.match(checkout, /checkoutIdempotencyKey = `marketplace-booking:\$\{booking\.id\}`/);
  assert.match(checkout, /retry:\$\{existingSession\.id\}/);
  assert.match(checkout, /idempotencyKey: checkoutIdempotencyKey/);
});

test("checkout redirects are outside Stripe error handling", () => {
  assert.match(checkout, /isRedirectError/);
  assert.match(checkout, /if \(isRedirectError\(error\)\) throw error/);
  assert.match(checkout, /completedReturnTo = `\$\{returnTo\}\?payment=success`/);
  assert.match(checkout, /if \(completedReturnTo\) redirect\(completedReturnTo\)/);
  assert.doesNotMatch(checkout.slice(checkout.indexOf("try {\n    const stripe"), checkout.indexOf("} catch (error)")), /redirect\(/);
  assert.doesNotMatch(checkout, /Existing Stripe session retrieval failed[\s\S]*NEXT_REDIRECT/);
});

test("valid existing and new checkout sessions redirect, while real Stripe failures remain payment errors", () => {
  assert.match(checkout, /existingSession\.status === "open" && existingSession\.url/);
  assert.match(checkout, /session = await stripe\.checkout\.sessions\.create/);
  assert.match(checkout, /paymentFailure = \{ error, setupFailure \}/);
  assert.match(checkout, /if \(paymentFailure\) redirect\(`\$\{returnTo\}\?error=/);
  assert.match(checkout, /if \(checkoutSessionId\) \{/);
  assert.match(checkout, /stripe_checkout_session_id: checkoutSessionId/);
});

test("paid bookings cannot restart checkout and retries reuse the persisted session", () => {
  assert.match(checkout, /\["paid", "refunded", "refund_pending", "partially_refunded", "cancelled"\]/);
  assert.match(checkout, /existingBooking\.completion_status === "completed"/);
  assert.match(checkout, /booking\.stripe_checkout_session_id/);
  assert.match(checkout, /marketplace-booking:\$\{booking\.id\}:retry:\$\{existingSession\.id\}/);
  assert.match(checkout, /idempotencyKey: checkoutIdempotencyKey/);
});

test("checkout attempts are reserved before Stripe and stale attempts are invalidated", () => {
  assert.match(checkoutRaceMigration, /stripe_checkout_attempt_id text/);
  assert.match(checkout, /stripe_checkout_attempt_id: crypto\.randomUUID\(\)/);
  assert.match(checkout, /checkout_attempt_id: booking\.stripe_checkout_attempt_id/);
  assert.match(checkoutRaceMigration, /stripe_checkout_attempt_id=null/);
  assert.match(read("app/api/stripe/webhook/route.ts"), /attemptMismatch/);
  assert.match(read("lib/server/marketplace-payment-finalization.ts"), /stripe_checkout_session_id\.is\.null/);
});

test("direct charges are opt-in, account-gated, and separate from historical transfers", () => {
  assert.match(directChargeMigration, /payment_flow text not null default 'platform_transfer'/);
  assert.match(directChargeMigration, /stripe_connected_account_id/);
  assert.match(directChargeMigration, /stripe_charge_id/);
  assert.match(directChargeMigration, /stripe_application_fee_id/);
  assert.match(directChargeMigration, /marketplace_payout_allocations/);
  assert.match(providerStripe, /directChargeReady/);
  assert.match(providerStripe, /merchant/);
  assert.match(providerStripe, /fees_collector: "stripe"/);
  assert.match(providerStripe, /losses_collector: "stripe"/);
  assert.match(checkout, /payment_flow === "direct_charge"/);
  assert.match(checkout, /application_fee_amount: platformFeePence/);
  assert.match(checkout, /stripeAccount: booking\.stripe_connected_account_id/);
  assert.match(directWebhooks, /charge\.refunded/);
  assert.match(directWebhooks, /charge\.dispute\.created/);
  assert.match(directWebhooks, /application_fee\.created/);
  assert.match(directPayouts, /marketplace_payout_allocations/);
  assert.match(directPayouts, /payouts\.create/);
  assert.match(directPayouts, /stripeAccount: booking\.stripe_connected_account_id/);
  assert.match(payoutAvailabilityMigration, /stripe_available_on timestamptz/);
  assert.match(read("lib/server/marketplace-direct-charge-webhooks.ts"), /payout\.paid/);
  assert.match(read("app/api/stripe/connect-webhook/route.ts"), /payout\.failed/);
  assert.match(transfers, /payment_flow === "direct_charge"/);
});

test("direct-charge payouts are scheduled, per-booking, and cron protected", () => {
  assert.match(payoutScheduleMigration, /payout_eligible_at timestamptz/);
  assert.match(payoutScheduleMigration, /'scheduled'/);
  assert.match(directPayouts, /scheduleDirectChargePayout/);
  assert.match(directPayouts, /payout_eligible_at/);
  assert.match(directPayouts, /stripe\.balance\.retrieve/);
  assert.match(directPayouts, /stripe_available_on/);
  assert.match(read("lib/server/marketplace-payment-finalization.ts"), /reconcileDirectChargePayoutAllocation/);
  assert.match(read("lib/server/marketplace-payment-finalization.ts"), /direct_charge_payout_allocation_reconcile_failed/);
  assert.match(directPayouts, /idempotencyKey: `marketplace-direct-payout:/);
  assert.match(read("app/api/cron/direct-charge-payouts/route.ts"), /CRON_SECRET/);
  assert.match(read("vercel.json"), /\/api\/cron\/direct-charge-payouts/);
  assert.match(read("vercel.json"), /0 \* \* \* \*/);
});

test("direct-charge eligibility lookup errors block ready active providers", () => {
  assert.match(checkout, /providerStripe\.stripe_status === "ready" && providerStripe\.marketplace_active/);
  assert.match(checkout, /error=payment_setup/);
});

test("every unpaid booking re-evaluates payment flow before checkout", () => {
  assert.match(checkout, /if \(providerStripe\?\.stripe_account_id\) \{/);
  assert.match(checkout, /selectedPaymentFlow = assessment\.directChargeReady \? "direct_charge" : "platform_transfer"/);
  assert.match(checkout, /const paymentFlowChanged = booking\.payment_flow !== selectedPaymentFlow/);
  assert.match(checkout, /stripe_checkout_session_id: null, stripe_checkout_attempt_id: nextCheckoutAttemptId/);
});

test("changing an unpaid flow invalidates an old checkout before switching architecture", () => {
  assert.match(checkout, /if \(paymentFlowChanged && booking\.stripe_checkout_session_id\) \{/);
  assert.match(checkout, /existingSession\.status === "complete" \|\| existingSession\.payment_status === "paid"/);
  assert.match(checkout, /checkout\.sessions\.expire\(existingSession\.id/);
  assert.match(checkout, /job\.status \|\| ""/);
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
  assert.match(customerActions, /rpc\("confirm_marketplace_completion"/);
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
