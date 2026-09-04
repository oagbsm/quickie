import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/jobs/[token]/page.tsx", "utf8");
const actions = fs.readFileSync("app/jobs/actions.ts", "utf8");
const payments = fs.readFileSync("app/jobs/payment-actions.ts", "utf8");
const migration = fs.readFileSync("supabase/migrations/202609040010_marketplace_pre_payment_provider_reselection.sql", "utf8");

test("customer selection is separate from payment and keeps the selected quote visible", () => {
  assert.match(actions, /rpc\("accept_marketplace_offer"/);
  assert.match(actions, /redirect\(`\$\{returnTo\.startsWith/);
  assert.doesNotMatch(actions.slice(actions.indexOf("export async function chooseMarketplaceQuote"), actions.indexOf("export async function changeMarketplaceProvider")), /createMarketplaceCheckout/);
  assert.match(page, /selectedQuoteId=\{acceptedQuote\?\.id \|\| null\}/);
  assert.match(page, /paymentLocked=\{acceptedBooking\?\.payment_status === "paid"\}/);
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
  assert.match(page, /unavailable = \["declined", "withdrawn", "expired"\]/);
  assert.match(page, /paymentLocked/);
  assert.match(page, /Payment required/);
});
