import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const action = read("app/jobs/actions.ts");
const providerAction = read("app/work/actions.ts");
const customerPage = read("app/jobs/[token]/page.tsx");
const completionActions = read("app/jobs/CompletionActions.tsx");
const providerPage = read("app/work/jobs/[id]/page.tsx");
const lifecycle = read("lib/marketplace/customer-job-state.ts");
const migration = read("supabase/migrations/202609040004_marketplace_completion_review.sql");
const safetyMigration = read("supabase/migrations/202609040006_marketplace_completion_review_safety.sql");

test("provider completion uses the existing authoritative intermediate state", () => {
  assert.match(providerPage, /\["awaiting_customer_completion", "Mark work complete"\]/);
  assert.match(providerAction, /rpc\("update_marketplace_booking_status"/);
  assert.match(providerAction, /notifyCustomerCompletionRequest\(bookingId\)/);
});

test("customer confirmation is independent from the optional review", () => {
  assert.match(completionActions, /Confirm job completed/);
  assert.match(completionActions, /Report a problem/);
  assert.match(customerPage, /submitMarketplaceReview/);
  const confirmationAction = action.slice(action.indexOf("export async function confirmMarketplaceCompletion"), action.indexOf("export async function submitMarketplaceReview"));
  assert.doesNotMatch(confirmationAction, /Number\(formData\.get\("rating"\)/);
  assert.match(action, /confirm_marketplace_completion/);
  assert.match(migration, /insert into public\.marketplace_reviews/);
  assert.match(migration, /set status = 'completed'/);
  assert.match(migration, /update public\.marketplace_jobs/);
  assert.match(customerPage, /Add a review \(optional\)/);
});

test("completion validation and safe diagnostics cover rejected submissions", () => {
  assert.match(action, /stage: "confirm_completion_rpc"/);
  assert.match(action, /stage: "confirm_completion_rpc"/);
  assert.match(action, /\[marketplace-completion\]/);
  assert.match(action, /code: text\("code"\)/);
  assert.match(migration, /c\.auth_user_id = auth\.uid\(\)/);
});

test("the persisted issue/hold state cannot present a completion form", () => {
  assert.match(lifecycle, /completion_status === "issue_reported"/);
  assert.match(lifecycle, /payout_hold_status === "held"/);
  assert.match(lifecycle, /completion_status === "awaiting_customer_completion"/);
  assert.match(customerPage, /completion_issue_reported/);
  assert.match(customerPage, /completion confirmation is paused/);
});

test("completion persists before payout release and payout failure cannot undo it", () => {
  const completionCall = action.indexOf('rpc("confirm_marketplace_completion"');
  const payoutCall = action.indexOf("transferMarketplaceProviderFunds(bookingId)");
  assert.ok(completionCall >= 0);
  assert.ok(payoutCall > completionCall);
  assert.match(action, /stage: "provider_payout_release"/);
  assert.match(action, /revalidatePath\(`\/jobs\/\$\{token\}`\)/);
  assert.doesNotMatch(action.slice(payoutCall, action.indexOf("try { await notifyCompletionOutcome")), /redirect\(/);
});

test("completion state and review rules remain server-authoritative", () => {
  assert.match(lifecycle, /awaiting_customer_completion/);
  assert.match(migration, /review_rating is null or review_rating < 1 or review_rating > 5/);
  assert.match(migration, /c\.auth_user_id = auth\.uid\(\)/);
  assert.match(migration, /where r\.booking_id = target_booking/);
  assert.match(migration, /returns public\.marketplace_bookings/);
  assert.match(migration, /current_booking\.status <> 'awaiting_customer_completion'/);
  assert.match(migration, /current_booking\.completion_status <> 'awaiting_customer_completion'/);
  assert.match(safetyMigration, /payout_hold_status = 'held'/);
});

test("review provider FK targets the current marketplace provider identity", () => {
  const migration = readFileSync(new URL("../supabase/migrations/202609040007_fix_marketplace_reviews_provider_fk.sql", import.meta.url), "utf8");
  assert.match(migration, /marketplace_reviews contains/);
  assert.match(migration, /marketplace_providers\.user_id/);
  assert.match(migration, /rel\.relname = 'marketplace_reviews'/);
  assert.match(migration, /frel\.relname = 'cleaner_profiles'/);
  assert.match(migration, /references public\.marketplace_providers\(user_id\)/);
  assert.match(migration, /on delete cascade/i);
  assert.doesNotMatch(migration, /delete from|truncate|update public\.marketplace_reviews/i);
});

test("completion notifications stay on the existing deduplicated paths", () => {
  const email = read("lib/marketplace/email/transactional.ts");
  assert.match(action, /notifyCompletionOutcome\(bookingId, "confirmed"/);
  assert.match(email, /completion_confirmation_customer/);
  assert.match(email, /completion_confirmed_provider/);
  assert.match(email, /dedupeKey/);
});
