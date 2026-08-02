import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  ONBOARDING_BATHROOMS,
  ONBOARDING_BEDROOMS,
  ONBOARDING_PROPERTY_TYPES,
  validateOnboardingPropertyBasics,
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

function validForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    nickname: "Harbour View Apartment",
    propertyType: "flat",
    addressLine1: "1 Harbour Street",
    city: "Slough",
    postcode: "sl25rx",
    bedrooms: "2",
    bathrooms: "1",
  })) form.set(name, value);
  return form;
}

test("valid onboarding property basics pass validation and normalise postcode", () => {
  assert.deepEqual(validateOnboardingPropertyBasics(validForm()), {});
  assert.equal(normaliseUkPostcode(" sl25rx "), "SL2 5RX");
});

test("invalid postcode returns a focused field error", () => {
  const form = validForm();
  form.set("postcode", "not-a-postcode");
  const errors = validateOnboardingPropertyBasics(form);
  assert.match(errors.postcode || "", /valid UK postcode/);
});

test("bedroom and bathroom values are constrained server-side", () => {
  for (const [field, value] of [["bedrooms", "-1"], ["bedrooms", "abc"], ["bathrooms", "0"], ["bathrooms", "2.5"]]) {
    const form = validForm();
    form.set(field, value);
    assert.ok(validateOnboardingPropertyBasics(form)[field as "bedrooms" | "bathrooms"]);
  }
  assert.deepEqual(ONBOARDING_BEDROOMS, ["0", "1", "2", "3", "4", "5"]);
  assert.deepEqual(ONBOARDING_BATHROOMS, ["1", "2", "3", "4", "5"]);
});

test("property type choices use existing persisted values and continue to standard", () => {
  assert.deepEqual(ONBOARDING_PROPERTY_TYPES, ["house", "flat", "airbnb", "serviced_apartment", "other"]);
  assert.match(page, /value === "airbnb"[\s\S]*?"Studio"/);
  assert.match(page, /Continue to turnover standard/);
  assert.match(actions, /value\(f, "returnTo"\) === "onboarding"[\s\S]*business\/onboarding\?step=standard/);
});
