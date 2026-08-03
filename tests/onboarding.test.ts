import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ONBOARDING_BEDROOMS,
  validatePropertyBasics,
} from "../lib/business/property-validation.ts";
import { normaliseUkPostcode } from "../lib/uk-address.ts";

const page = readFileSync(
  new URL("../app/business/onboarding/PropertyBasicsForm.tsx", import.meta.url),
  "utf8",
);
const actions = readFileSync(
  new URL("../app/business/actions.ts", import.meta.url),
  "utf8",
);
const onboarding = readFileSync(
  new URL("../app/business/onboarding/page.tsx", import.meta.url),
  "utf8",
);

function validForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    nickname: "Harbour View Apartment",
    addressLine1: "1 Harbour Street",
    postcode: "sl25rx",
    bedrooms: "2",
  })) form.set(name, value);
  return form;
}

test("valid onboarding property basics pass validation and normalise postcode", () => {
  assert.deepEqual(validatePropertyBasics(validForm()), {});
  assert.equal(normaliseUkPostcode(" sl25rx "), "SL2 5RX");
});

test("invalid postcode returns a focused field error", () => {
  const form = validForm();
  form.set("postcode", "not-a-postcode");
  const errors = validatePropertyBasics(form);
  assert.match(errors.postcode || "", /valid UK postcode/);
});

test("bedroom values are constrained server-side", () => {
  for (const value of ["-1", "abc", "6"]) {
    const form = validForm();
    form.set("bedrooms", value);
    assert.ok(validatePropertyBasics(form).bedrooms);
  }
  assert.deepEqual(ONBOARDING_BEDROOMS, ["0", "1", "2", "3", "4", "5"]);
});

test("only the four property basics are collected and onboarding skips Turnover Standard", () => {
  assert.match(page, /Property name/);
  assert.match(page, /Full address/);
  assert.match(page, /Postcode/);
  assert.match(page, /Bedrooms/);
  assert.doesNotMatch(page, /Property type|Town or city|Bathrooms/);
  assert.match(page, /Continue/);
  assert.match(actions, /value\(f, "returnTo"\) === "onboarding"[\s\S]*business\/onboarding\?step=cleaner/);
  assert.doesNotMatch(onboarding, /Turnover Standard|turnover standard|saveOnboardingStandard|step=standard/);
  assert.match(onboarding, /STEP \{number\} OF 2/);
});

test("onboarding routes and actions re-check authoritative completion state", () => {
  const onboarding = readFileSync(new URL("../app/business/onboarding/page.tsx", import.meta.url), "utf8");
  const strActions = readFileSync(new URL("../app/business/str-actions.ts", import.meta.url), "utf8");
  assert.match(onboarding, /onboarding_completed_at/);
  assert.match(onboarding, /redirect\("\/business\/dashboard"\)/);
  assert.match(strActions, /export async function skipCleanerOnboarding/);
  assert.doesNotMatch(strActions, /export async function saveOnboardingStandard/);
  assert.match(strActions, /onboardingAccount\?\.onboarding_step === "complete"/);
});
