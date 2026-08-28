import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync(new URL("../app/work/page.tsx", import.meta.url), "utf8");
const onboarding = readFileSync(new URL("../app/work/onboarding/OnboardingForm.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../app/work/onboarding/actions.ts", import.meta.url), "utf8");
const access = readFileSync(new URL("../lib/marketplace/provider-access.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/202608280001_provider_browse_eligibility.sql", import.meta.url), "utf8");
const operationalMigration = readFileSync(new URL("../supabase/migrations/202608220003_provider_operational_eligibility.sql", import.meta.url), "utf8");

test("provider onboarding separates Maidenhead browsing from quote readiness", () => {
  assert.match(onboarding, /Basic profile/);
  assert.match(onboarding, /See matching Maidenhead jobs/);
  assert.match(onboarding, /Get ready to send quotes/);
  assert.doesNotMatch(onboarding, /Where do you work|Select one or more postcode districts/);
  assert.match(actions, /base_town: "Maidenhead"/);
  assert.match(actions, /MAIDENHEAD_MARKET_POSTCODE_DISTRICTS/);
});

test("browsing uses a separate server-side gate and RPC", () => {
  assert.match(access, /canProviderBrowseJobs/);
  assert.match(page, /get_marketplace_browse_opportunities/);
  assert.match(migration, /marketplace_provider_can_browse/);
  assert.match(migration, /get_marketplace_browse_opportunities/);
  assert.match(migration, /SL6/);
  assert.match(migration, /ps\.category_slug = j\.service/);
  assert.match(migration, /ps\.job_type_slug = j\.service_subtype/);
});

test("strict quote and regulated qualification gates remain present", () => {
  assert.match(actions, /provider_terms_accepted_at/);
  assert.match(access, /stripeStatus === "ready"/);
  assert.match(operationalMigration, /provider_status = 'approved'/);
  assert.match(operationalMigration, /stripe_status = 'ready'/);
  assert.match(operationalMigration, /marketplace_active = true/);
  assert.match(operationalMigration, /qualification_verified/);
});
