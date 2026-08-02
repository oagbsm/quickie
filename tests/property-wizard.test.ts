import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { validatePropertyBasics } from "../lib/business/property-validation.ts";
import { formatTurnoverDuration, formatTurnoverDurationLong, isSupportedTurnoverDuration, TURNOVER_DURATION_OPTIONS } from "../lib/business/turnover-validation.ts";

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
  assert.doesNotMatch(wizard, /summary\.reservationCalendarUrl[^\n]*https/);
  assert.equal(TURNOVER_DURATION_OPTIONS.length, 8);
  assert.equal(formatTurnoverDuration(180), "3h");
  assert.equal(formatTurnoverDuration(300), "5+");
  assert.equal(formatTurnoverDurationLong(60), "1 hour");
  assert.equal(formatTurnoverDurationLong(90), "1.5 hours");
  assert.equal(formatTurnoverDurationLong(180), "3 hours");
  assert.equal(isSupportedTurnoverDuration(210), true);
  assert.equal(isSupportedTurnoverDuration(999), false);
});

test("unconfigured address lookup is not rendered, while configured support remains available", () => {
  assert.match(page, /addressLookupEnabled=\{Boolean\(process\.env\.GETADDRESS_API_KEY\)\}/);
  assert.match(wizard, /addressLookupEnabled && <AddressLookup \/>/);
  assert.doesNotMatch(wizard, /Address lookup is not configured/);
});

test("portal wizard keeps its four steps and review omits removed metadata", () => {
  assert.match(wizard, /"Property details"/);
  assert.match(wizard, /"Turnover timings"/);
  assert.match(wizard, /"Connect calendar"/);
  assert.match(wizard, /Connect your booking calendar/);
  assert.doesNotMatch(wizard, /name="reservationConnectionName"/);
  assert.match(wizard, /has-\[:checked\]:border/);
  assert.match(wizard, /useState\(""\)/);
  assert.doesNotMatch(wizard, /useState\([^)]*localStorage/);
  assert.match(wizard, /\/brands\/airbnb\.svg/);
  assert.match(wizard, /\/brands\/booking-com\.svg/);
  assert.match(wizard, /\/brands\/vrbo\.svg/);
  assert.doesNotMatch(wizard, /reservationSource === option\.value \?/);
  assert.match(wizard, /"Review and create"/);
  assert.match(wizard, /Ready to create your property\?/);
  assert.match(wizard, /Review the essentials below\. You can change these settings anytime\./);
  assert.match(wizard, /Turnover timing/);
  assert.match(wizard, /Calendar/);
  assert.match(wizard, /Not connected yet/);
  assert.match(wizard, /Will connect when property is created/);
  assert.match(wizard, /onClick=\{\(\) => edit\(0\)\}/);
  assert.match(wizard, /onClick=\{\(\) => edit\(1\)\}/);
  assert.match(wizard, /onClick=\{\(\) => edit\(2\)\}/);
  assert.doesNotMatch(wizard, /Review and create<\/h2>/);
  assert.doesNotMatch(wizard, /summary\.reservationCalendarUrl\}.*https/);
  assert.match(wizard, /summary\.addressLine1\}, \{summary\.postcode/);
  assert.doesNotMatch(wizard, /summary\.city/);
  assert.match(migration, /alter column city drop not null/);
  assert.match(migration, /alter column property_type drop not null/);
  assert.match(actions, /city: optional\(f, "city"\)/);
  assert.match(actions, /property_type: optional\(f, "propertyType"\)/);
  assert.match(actions, /access_method: optional\(f, "accessMethod"\)/);
  assert.match(actions, /initialBasicsOnly/);
});
