import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const home = read("app/page.tsx");
const work = read("app/work/page.tsx");
const pending = read("app/work/onboarding/PendingReview.tsx");
const roles = read("lib/auth/account-role.ts");

test("provider root routing keeps pending providers out of customer home", () => {
  assert.match(home, /destinationForAccount/);
  assert.match(roles, /providerStatus/);
});

test("pending provider work view remains isolated while exposing the review CTA", () => {
  assert.match(work, /\["pending_review", "suspended"\]/);
  assert.match(pending, /View available jobs/);
  assert.match(pending, /You’re all signed up!/);
});

test("marketplace role resolver has deterministic admin precedence", () => {
  assert.match(roles, /if \(adminResult\.data\) return \{ role: "admin"/);
  assert.match(roles, /if \(providerResult\.data\) return \{ role: "provider"/);
  assert.match(roles, /if \(customerResult\.data\) return \{ role: "customer"/);
});

test("direct role destinations remain marketplace-specific", () => {
  assert.match(roles, /destinationForAccount/);
  assert.doesNotMatch(home, /getMarketplaceProvider/);
});
