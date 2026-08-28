import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("app/page.tsx");
const work = read("app/work/page.tsx");
const pending = read("app/work/onboarding/PendingReview.tsx");
const roles = read("lib/auth/account-role.ts");

test("provider root routing keeps pending providers out of customer home", () => {
  assert.match(home, /provider\?\.providerStatus === "approved" \|\| provider\?\.providerStatus === "pending_review"/);
  assert.match(home, /\/work\/onboarding/);
});

test("pending provider work view does not browse or expose the old CTA", () => {
  assert.match(work, /\["pending_review", "suspended"\]/);
  assert.doesNotMatch(pending, /View available jobs/);
  assert.match(pending, /Your application is being reviewed/);
});

test("marketplace role resolver has deterministic admin precedence", () => {
  assert.match(roles, /if \(adminResult\.data\) return "admin"/);
  assert.match(roles, /if \(providerResult\.data\) return "provider"/);
  assert.match(roles, /if \(customerResult\.data\) return "customer"/);
});
