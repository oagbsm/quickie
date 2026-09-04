import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const script = readFileSync(new URL("../scripts/marketplace-sandbox.ts", import.meta.url), "utf8");
const guard = readFileSync(new URL("../scripts/sandbox-guard.ts", import.meta.url), "utf8");
const docs = readFileSync(new URL("../docs/marketplace-sandbox.md", import.meta.url), "utf8");
const emailRoute = readFileSync(new URL("../app/api/sandbox/marketplace-email/route.ts", import.meta.url), "utf8");
const scenarios = readFileSync(new URL("../scripts/marketplace-scenarios.ts", import.meta.url), "utf8");
const manifest = readFileSync(new URL("../scripts/scenario-manifest.ts", import.meta.url), "utf8");

test("sandbox guard rejects production by default and never permits live Stripe", () => {
  assert.match(guard, /process\.env\.QUICKOLA_SANDBOX !== "true"/);
  assert.match(guard, /QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX === "true"/);
  assert.match(guard, /productionTarget &&/);
  assert.match(guard, /!stripeSecret\.startsWith\("sk_test_"\)/);
});

test("sandbox reset requires production confirmation and supports dry-run", () => {
  assert.match(script, /QUICKOLA_SANDBOX_RESET_CONFIRM !== "DELETE_SANDBOX_FIXTURES_ONLY"/);
  assert.match(script, /const dryRun = process\.argv\.includes\("--dry-run"\)/);
  assert.match(script, /if \(dryRun\)[\s\S]*wouldDelete/);
  assert.match(script, /delete\(\)\.in\("id", jobIds\)/);
  assert.match(script, /auth\.admin\.deleteUser\(user\.id\)/);
  assert.doesNotMatch(script, /truncate/i);
});

test("sandbox fixtures use deterministic identities and markers", () => {
  for (const value of ["customer+sandbox@quickola.test", "provider+sandbox@quickola.test", "admin+sandbox@quickola.test", "00000000-0000-4000-8000-000000000001", "[quickola-sandbox-fixture]"]) assert.match(guard, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(docs, /Using the existing production Supabase database for sandbox fixtures/i);
});

test("sandbox email adapter is fail-closed and fixture-authenticated", () => {
  assert.match(emailRoute, /NODE_ENV === "production"/);
  assert.match(emailRoute, /QUICKOLA_SANDBOX !== "true"/);
  assert.match(emailRoute, /QUICKOLA_ALLOW_PRODUCTION_DB_FOR_SANDBOX !== "true"/);
  assert.match(emailRoute, /QUICKOLA_SCENARIO_EXECUTION_CONFIRM !== "RUN_SANDBOX_SCENARIOS_ONLY"/);
  assert.match(emailRoute, /sandbox_fixture_required/);
  assert.match(emailRoute, /signIn|getUser\(\)/);
  assert.match(readFileSync(new URL("../lib/marketplace/email/transactional.ts", import.meta.url), "utf8"), /NODE_ENV !== "production" && process\.env\.QUICKOLA_SANDBOX === "true"/);
});

test("scenario runner is comprehensive and fail-closed", () => {
  for (const scenario of ["normal-successful-booking", "customer-dispute-refund-resolution", "duplicate-webhook", "duplicate-transfer", "payout-blocking-matrix", "review-security", "conversation-security", "refund-bounds", "authorization-matrix"]) assert.match(scenarios, new RegExp(scenario));
  assert.match(scenarios, /requireProductionOverride: true/);
  assert.match(scenarios, /writes: false/);
  assert.match(scenarios, /assertExecutionAllowed/);
  assert.match(guard, /QUICKOLA_SCENARIO_EXECUTION_CONFIRM/);
  assert.match(scenarios, /runNormal/);
  assert.match(manifest, /\.delete\(\)\.in\("id", ids\)/);
  assert.doesNotMatch(manifest, /truncate|delete\(\)\.eq\("status"/i);
});
