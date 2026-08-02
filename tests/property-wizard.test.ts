import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validatePropertyBasics } from "../lib/business/property-validation.ts";
import { formatTurnoverDuration, isSupportedTurnoverDuration, TURNOVER_DURATION_OPTIONS } from "../lib/business/turnover-validation.ts";

const wizard = readFileSync(
  new URL("../app/business/components/PropertyWizard.tsx", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../app/business/properties/new/page.tsx", import.meta.url),
  "utf8",
);
const migration = readFileSync(
  new URL("../supabase/migrations/202608020001_property_basics_optional_metadata.sql", import.meta.url),
  "utf8",
);
const actions = readFileSync(
  new URL("../app/business/actions.ts", import.meta.url),
  "utf8",
);

function basics() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    nickname: "Harbour View Apartment",
    addressLine1: "1 Harbour Street",
    postcode: "SL2 5RX",
    bedrooms: "2",
  })) form.set(name, value);
  return form;
}

test("portal property creation can validate with only four basics", () => {
  assert.deepEqual(validatePropertyBasics(basics()), {});
  assert.match(wizard, /name="nickname"/);
  assert.match(wizard, /name="addressLine1"/);
  assert.match(wizard, /name="postcode"/);
  assert.match(wizard, /name="bedrooms"/);
  assert.doesNotMatch(wizard, /name="propertyType"|name="city"|name="bathrooms"|name="propertyImage"|name="addressLine2"/);
});

test("turnover step exposes only supported timing fields and durations", () => {
  assert.match(wizard, /name="defaultCheckoutTime"/);
  assert.match(wizard, /name="defaultCheckinTime"/);
  assert.match(wizard, /name="estimatedTurnoverMinutes"/);
  assert.doesNotMatch(wizard, /name="accessNotes"|name="keyInstructions"|name="requiredCompletionPhotos"/);
  assert.match(actions, /airbnb: "Airbnb calendar"/);
  assert.match(actions, /booking_com: "Booking.com calendar"/);
  assert.match(actions, /vrbo: "Vrbo calendar"/);
  assert.match(actions, /other: "Calendar"/);
  assert.equal(TURNOVER_DURATION_OPTIONS.length, 8);
  assert.equal(formatTurnoverDuration(180), "3h");
  assert.equal(formatTurnoverDuration(300), "5+");
  assert.equal(isSupportedTurnoverDuration(210), true);
  assert.equal(isSupportedTurnoverDuration(999), false);
});

test("unconfigured address lookup is not rendered, while configured support remains available", () => {
  assert.match(page, /addressLookupEnabled=\{Boolean\(process\.env\.GETADDRESS_API_KEY\)\}/);
  assert.match(wizard, /addressLookupEnabled && <AddressLookup \/>/);
  assert.doesNotMatch(wizard, /Address lookup is not configured/);
});

test("portal wizard has three steps and creates from the final calendar step", () => {
  assert.match(wizard, /"Property details"/);
  assert.match(wizard, /"Turnover timings"/);
  assert.match(wizard, /"Connect calendar"/);
  assert.match(wizard, /STEP 1 OF 3/);
  assert.match(wizard, /STEP 2 OF 3/);
  assert.match(wizard, /STEP 3 OF 3/);
  assert.match(wizard, /grid grid-cols-3/);
  assert.equal((wizard.match(/<section data-step="/g) || []).length, 3);
  assert.doesNotMatch(wizard, /STEP 4 OF 4|Review and create|Ready to create your property\?|onClick=\{\(\) => edit/);
  assert.match(wizard, /<PendingButton[\s\S]*idle="Create property"[\s\S]*pending="Creating property…"/);
  assert.match(wizard, /action=\{addProperty\}/);
  assert.doesNotMatch(wizard, /name="reservationConnectionName"/);
  assert.match(wizard, /has-\[:checked\]:border/);
  assert.match(wizard, /useState\(""\)/);
  assert.doesNotMatch(wizard, /useState\([^)]*localStorage/);
  assert.match(wizard, /\/icons\/airbnb\.png/);
  assert.match(wizard, /\/icons\/booking\.jpg/);
  assert.match(wizard, /\/icons\/vrbo\.png/);
  assert.match(wizard, /\/icons\/expedia\.png/);
  assert.match(wizard, /value: "expedia", label: "Expedia"/);
  assert.match(wizard, /expedia: "Expedia"/);
  assert.match(wizard, /Paste your Expedia calendar link\./);
  assert.match(wizard, /providerNames\[reservationSource\]/);
  assert.doesNotMatch(wizard, /reservationSource === option\.value \?/);
  assert.match(wizard, /Back/);
  assert.match(wizard, /value="connect_later"/);
  assert.match(wizard, /value: "airbnb"/);
  assert.match(wizard, /value: "booking_com"/);
  assert.match(wizard, /value: "vrbo"/);
  assert.match(wizard, /value: "expedia"/);
  assert.match(wizard, /value: "other"/);
  assert.match(migration, /alter column city drop not null/);
  assert.match(migration, /alter column property_type drop not null/);
  assert.match(actions, /city: optional\(f, "city"\)/);
  assert.match(actions, /property_type: optional\(f, "propertyType"\)/);
  assert.match(actions, /access_method: optional\(f, "accessMethod"\)/);
  assert.match(actions, /initialBasicsOnly/);
});
