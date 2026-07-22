import test from "node:test";
import assert from "node:assert/strict";
import { calculatePilotQuote } from "../lib/business/pricing.ts";
import {
  canTransitionBooking,
  getBookingStatus,
} from "../lib/business/booking-status.ts";
import {
  formatBusinessDateTime,
  getPilotStartTimes,
  isPracticalBookingTime,
  londonLocalToUtc,
  validatePilotSchedule,
} from "../lib/business/time.ts";
const base = {
  frequency: "one_off",
  propertyType: "flat",
  bedrooms: 2,
  bathrooms: 1,
  extras: [],
  serviceAreaStatus: "eligible",
} as const;
test("regular cleaning uses the versioned hourly pilot configuration", () => {
  const q = calculatePilotQuote({ ...base, service: "regular_cleaning" });
  assert.equal(q.estimatedDurationMinutes, 150);
  assert.equal(q.estimatedPricePence, 5500);
  assert.equal(q.pricingMode, "instant");
});
test("deep and end-of-tenancy services add configured duration", () => {
  assert.equal(
    calculatePilotQuote({ ...base, service: "deep_cleaning" })
      .estimatedDurationMinutes,
    240,
  );
  assert.equal(
    calculatePilotQuote({ ...base, service: "end_of_tenancy" })
      .estimatedDurationMinutes,
    300,
  );
});
test("extras and frequency discounts are calculated in integer pence", () => {
  const q = calculatePilotQuote({
    ...base,
    service: "regular_cleaning",
    frequency: "weekly",
    extras: ["inside_oven"],
  });
  assert.equal(q.estimatedDurationMinutes, 210);
  assert.equal(q.estimatedPricePence, 6930);
  assert.ok(q.breakdown.some((x) => x.key === "frequency_discount"));
});
test("large and outside-area jobs require manual review", () => {
  assert.equal(
    calculatePilotQuote({ ...base, service: "regular_cleaning", bedrooms: 7 })
      .requiresManualReview,
    true,
  );
  assert.equal(
    calculatePilotQuote({
      ...base,
      service: "regular_cleaning",
      serviceAreaStatus: "outside_area",
    }).pricingMode,
    "manual_review",
  );
});
test("canonical transitions reject invalid lifecycle changes", () => {
  assert.equal(canTransitionBooking("requested", "under_review"), true);
  assert.equal(canTransitionBooking("completed", "requested"), false);
  assert.equal(canTransitionBooking("cancelled", "provider_assigned"), false);
  assert.equal(canTransitionBooking("provider_assigned", "on_the_way"), true);
  assert.equal(canTransitionBooking("on_the_way", "arrived"), true);
  assert.equal(canTransitionBooking("arrived", "in_progress"), true);
  assert.equal(getBookingStatus("confirmed").customerLabel, "Appointment confirmed");
});
test("London time formatting handles winter and summer DST", () => {
  assert.match(formatBusinessDateTime("2026-01-15T12:00:00Z"), /12:00/);
  assert.match(formatBusinessDateTime("2026-07-15T12:00:00Z"), /13:00/);
  assert.equal(isPracticalBookingTime("10:00"), true);
  assert.equal(isPracticalBookingTime("10:30"), false);
  assert.equal(isPracticalBookingTime("10:13"), false);
});
test("London local selections persist as the correct UTC instant", () => {
  assert.equal(
    londonLocalToUtc("2026-01-15", "10:00").toISOString(),
    "2026-01-15T10:00:00.000Z",
  );
  assert.equal(
    londonLocalToUtc("2026-07-15", "10:00").toISOString(),
    "2026-07-15T09:00:00.000Z",
  );
});
test("pilot scheduling rejects Sundays, short lead times and duration overflow", () => {
  const now = new Date("2026-07-20T07:00:00Z");
  assert.equal(
    validatePilotSchedule("2026-07-26", "10:00", 120, now).ok,
    false,
  );
  assert.equal(
    validatePilotSchedule("2026-07-20", "16:00", 120, now).ok,
    false,
  );
  assert.equal(validatePilotSchedule("2026-07-22", "08:00", 120, now).ok, true);
  assert.deepEqual(getPilotStartTimes(300), [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
  ]);
});
