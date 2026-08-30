import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const onboarding = readFileSync(new URL("../app/work/onboarding/actions.ts", import.meta.url), "utf8");
const profile = readFileSync(new URL("../app/work/profile/actions.ts", import.meta.url), "utf8");
const schema = readFileSync(new URL("../supabase/migrations/202608100007_marketplace_quotes_and_provider_supply.sql", import.meta.url), "utf8");
const decoupling = readFileSync(new URL("../supabase/migrations/202608300002_marketplace_provider_decoupling.sql", import.meta.url), "utf8");

test("provider service persistence uses marketplace provider UUIDs and the current uniqueness key", () => {
  assert.match(schema, /provider_id uuid not null references public\.cleaner_profiles\(user_id\)/);
  assert.match(schema, /unique\(provider_id, job_type_slug\)/);
  assert.match(decoupling, /REFERENCES public\.marketplace_providers\(user_id\)/);
  assert.match(onboarding, /saveServicesAndCoverage\(provider\.user\.id, provider\.providerId, services\)/);
  assert.match(onboarding, /onConflict: "provider_id,job_type_slug"/);
  assert.match(profile, /onConflict: "provider_id,job_type_slug"/);
});

test("service saves upsert before removing deselected relationships", () => {
  const upsertIndex = onboarding.indexOf("upsert selected services");
  const removeIndex = onboarding.indexOf("remove deselected services");
  assert.ok(upsertIndex >= 0);
  assert.ok(removeIndex > upsertIndex);
  assert.match(onboarding, /new Set\(form\.getAll\("service"\)/);
  assert.match(onboarding, /select\("id,category_slug,job_type_slug,qualification_verified"\)/);
  assert.match(onboarding, /\.in\("id", removable\)/);
});

test("service persistence failures are structured server logs and friendly redirects", () => {
  assert.match(onboarding, /\[provider-services\] operation failed/);
  assert.match(onboarding, /userId, providerId, serviceCount/);
  assert.match(onboarding, /code: error\.code/);
  assert.match(onboarding, /redirect\("\/work\/onboarding\?error=save"\)/);
});
