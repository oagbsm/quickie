import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validatePropertyBasics } from "../lib/business/property-validation.ts";

const wizard = readFileSync(
  new URL("../app/business/components/PropertyWizard.tsx", import.meta.url),
  "utf8",
);
const propertyForm = readFileSync(
  new URL("../app/business/components/PropertyForm.tsx", import.meta.url),
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

test("property creation does not render or require Turnover Standard fields", () => {
  assert.doesNotMatch(wizard, /Turnover timings|name="defaultCheckoutTime"|name="defaultCheckinTime"|name="estimatedTurnoverMinutes"/);
  assert.match(propertyForm, /property\?\.id \? <fieldset/);
  assert.doesNotMatch(propertyForm, /Add property and standard/);
  assert.match(actions, /requestedDuration && !isSupportedTurnoverDuration/);
  assert.doesNotMatch(actions, /!requestedDuration/);
  assert.match(actions, /airbnb: "Airbnb calendar"/);
  assert.match(actions, /booking_com: "Booking.com calendar"/);
  assert.match(actions, /vrbo: "Vrbo calendar"/);
  assert.match(actions, /other: "Calendar"/);
});

test("unconfigured address lookup is not rendered, while configured support remains available", () => {
  assert.match(page, /addressLookupEnabled=\{Boolean\(process\.env\.GETADDRESS_API_KEY\)\}/);
  assert.match(wizard, /addressLookupEnabled && <AddressLookup \/>/);
  assert.doesNotMatch(wizard, /Address lookup is not configured/);
});

test("portal wizard has two steps and creates from the final calendar step", () => {
  assert.match(wizard, /"Property details"/);
  assert.match(wizard, /"Connect calendar"/);
  assert.match(wizard, /STEP 1 OF 2/);
  assert.match(wizard, /STEP 2 OF 2/);
  assert.match(wizard, /grid grid-cols-2/);
  assert.equal((wizard.match(/<section data-step="/g) || []).length, 2);
  assert.doesNotMatch(wizard, /Turnover timings|STEP 3 OF 3/);
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
