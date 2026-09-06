import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/jobs/[token]/page.tsx", "utf8");
const actions = fs.readFileSync("app/jobs/actions.ts", "utf8");
const payments = fs.readFileSync("app/jobs/payment-actions.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/202609040010_marketplace_pre_payment_provider_reselection.sql", "utf8");
const safetyMigration = fs.readFileSync("supabase/migrations/20260906080806_marketplace_pre_payment_switch_and_cancel_safety.sql", "utf8");
const cancellationMigration = fs.readFileSync("supabase/migrations/20260906080919_marketplace_pre_payment_cancel_without_booking.sql", "utf8");
const reselectionMigration = fs.readFileSync("supabase/migrations/20260906083148_marketplace_pre_payment_quote_reselection_eligibility.sql", "utf8");
const webhook = fs.readFileSync("app/api/stripe/webhook/route.ts", "utf8");
const messageActions = fs.readFileSync("app/messages/actions.ts", "utf8");

test("customer selection is separate from payment and keeps the selected quote visible", () => {
  assert.match(actions, /rpc\("accept_marketplace_offer"/);
  assert.match(actions, /redirect\(`\$\{returnTo\.startsWith/);
  assert.doesNotMatch(actions.slice(actions.indexOf("export async function chooseMarketplaceQuote"), actions.indexOf("export async function changeMarketplaceProvider")), /createMarketplaceCheckout/);
  assert.match(page, /selectedQuoteId=\{acceptedQuote\?\.id \|\| null\}/);
  assert.match(page, /paymentLocked=\{getMarketplacePaymentState\(acceptedBooking\) === "paid"\}/);
  assert.match(page, /changeMarketplaceProvider/);
});

test("reselection uses one locked unpaid booking and clears stale checkout identity", () => {
  assert.match(actions, /rpc\("change_marketplace_selected_quote"/);
  assert.match(migration, /if current_booking\.payment_status = 'paid'/);
  assert.match(migration, /stripe_checkout_session_id = null/);
  assert.match(migration, /stripe_payment_intent_id = null/);
  assert.match(migration, /where b\.job_id = target_job\.id/);
  assert.match(payments, /\.eq\("job_id", job\.id\)\.maybeSingle\(\)/);
  assert.match(payments, /booking\.quote_id !== quote\.id/);
  assert.match(payments, /stripe_checkout_session_id: null/);
});

test("customer can see declined quote history without reopening paid changes", () => {
  assert.match(page, /customerVisibleQuoteStatuses = \[\.\.\.ACTIVE_MARKETPLACE_OFFER_STATUSES, "declined"\]/);
  assert.match(page, /unavailable = \["withdrawn", "expired"\]/);
  assert.match(page, /paymentLocked/);
  assert.match(page, /Payment required/);
});

test("pre-payment cancellation is locked, customer-authorized, and clears payment identity", () => {
  assert.match(safetyMigration, /create or replace function public\.cancel_marketplace_job_before_payment/);
  assert.match(safetyMigration, /for update of j/);
  assert.match(safetyMigration, /where b\.job_id=target_job\.id for update/);
  assert.match(cancellationMigration, /if current_booking\.id is not null/);
  assert.match(safetyMigration, /if current_booking\.payment_status='paid' then raise exception 'booking_paid'/);
  assert.match(safetyMigration, /payment_status='cancelled'/);
  assert.match(safetyMigration, /stripe_checkout_session_id=null/);
  assert.match(safetyMigration, /stripe_payment_intent_id=null/);
  assert.match(safetyMigration, /update public\.marketplace_jobs set status='cancelled'/);
  assert.match(webhook, /booking\.stripe_checkout_session_id !== session\.id/);
  assert.match(webhook, /stale_or_cancelled_session/);
});

test("conversation job promotion is rejected after selection or booking", () => {
  assert.match(messageActions, /marketplace_bookings/);
  assert.match(messageActions, /marketplace_quotes/);
  assert.match(messageActions, /\["posted", "finding_provider", "provider_available"\]/);
  assert.match(messageActions, /This job can no longer be changed after a provider has been selected/);
});

test("unpaid declined alternatives remain selectable only through eligible reselection", () => {
  assert.match(page, /quote\.status === "declined"/);
  assert.match(page, /paymentLocked \|\| !selectedQuoteId/);
  assert.match(reselectionMigration, /q\.status in \('pending','submitted','accepted','selected','declined'\)/);
  assert.match(reselectionMigration, /p\.provider_status='approved'/);
  assert.match(reselectionMigration, /p\.stripe_status='ready'/);
  assert.match(reselectionMigration, /p\.marketplace_active and p\.available_now/);
  assert.match(reselectionMigration, /if current_booking\.payment_status='paid'/);
});
