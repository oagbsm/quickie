import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculatePilotQuote } from "../lib/business/pricing.ts";
import {
  BOOKING_STATUSES,
  canShowAssignedProvider,
  canTransitionBooking,
  cleanOptionalText,
  getBookingTimeline,
  getDashboardBanner,
  getDashboardStatusCounts,
  getPricePresentation,
  getBookingStatus,
} from "../lib/business/booking-status.ts";
import {
  formatBusinessDateTime,
  getPilotStartTimes,
  isPracticalBookingTime,
  londonLocalToUtc,
  validatePilotSchedule,
} from "../lib/business/time.ts";
import { getServiceAreaStatus } from "../lib/business/service-area.ts";
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
  assert.equal(getBookingStatus("confirmed").customerLabel, "Confirmed");
});
test("every canonical status has one complete customer presentation", () => {
  for (const status of BOOKING_STATUSES) {
    const presentation = getBookingStatus(status);
    assert.ok(presentation.customerLabel);
    assert.ok(presentation.customerTitle);
    assert.ok(presentation.customerCopy);
    assert.ok(presentation.actionCopy);
    assert.ok(
      ["firm", "provisional", "historical"].includes(
        presentation.priceCertainty,
      ),
    );
    if (status === "cancelled" || status === "unable_to_fulfil")
      assert.deepEqual(getBookingTimeline(status), []);
    else assert.equal(getBookingTimeline(status).length, 5);
  }
});
test("customer timeline shows completed, current and future stages", () => {
  assert.deepEqual(
    getBookingTimeline("requested").map((step) => step.state),
    ["current", "future", "future", "future", "future"],
  );
  assert.deepEqual(
    getBookingTimeline("provider_assigned").map((step) => step.state),
    ["complete", "complete", "current", "future", "future"],
  );
  assert.deepEqual(
    getBookingTimeline("completed").map((step) => step.state),
    ["complete", "complete", "complete", "complete", "current"],
  );
});
test("provider identity is only presented from the assigned lifecycle stage", () => {
  for (const status of [
    "requested",
    "under_review",
    "awaiting_customer_confirmation",
    "confirmed",
    "cancelled",
    "unable_to_fulfil",
  ])
    assert.equal(canShowAssignedProvider(status), false);
  for (const status of [
    "provider_assigned",
    "on_the_way",
    "arrived",
    "in_progress",
    "completed",
  ])
    assert.equal(canShowAssignedProvider(status), true);
});
test("price wording distinguishes firm, review-required and revised totals", () => {
  assert.deepEqual(
    getPricePresentation({
      status: "requested",
      pricing_mode: "instant",
      estimated_price_pence: 9900,
    }),
    {
      label: "Booking total",
      certainty: "firm",
      amountPence: 9900,
      maximumPence: null,
      explanation:
        "This total was calculated from the property and service details submitted.",
    },
  );
  const review = getPricePresentation({
    status: "under_review",
    pricing_mode: "manual_review",
    estimated_price_pence: 9900,
    estimated_price_max_pence: 11880,
  });
  assert.equal(review.label, "Estimated total");
  assert.equal(review.certainty, "provisional");
  assert.equal(review.maximumPence, 11880);
  const revised = getPricePresentation({
    status: "awaiting_customer_confirmation",
    pricing_mode: "instant",
    estimated_price_pence: 9900,
    agreed_price_pence: 10500,
  });
  assert.equal(revised.label, "Revised total");
  assert.equal(revised.amountPence, 10500);
});
test("the production 4 hr 30 min scenario correctly totals £99 including inside windows", () => {
  const quote = calculatePilotQuote({
    service: "regular_cleaning",
    frequency: "one_off",
    propertyType: "house",
    bedrooms: 3,
    bathrooms: 2,
    extras: ["inside_windows"],
    serviceAreaStatus: "eligible",
  });
  assert.equal(quote.estimatedDurationMinutes, 270);
  assert.equal(quote.estimatedPricePence, 9900);
  assert.equal(quote.requiresManualReview, false);
});
test("recurring prices and integer currency rounding remain deterministic", () => {
  const oneOff = calculatePilotQuote({
    ...base,
    service: "regular_cleaning",
    extras: ["inside_windows"],
  });
  const weekly = calculatePilotQuote({
    ...base,
    service: "regular_cleaning",
    frequency: "weekly",
    extras: ["inside_windows"],
  });
  assert.equal(oneOff.estimatedPricePence, 7700);
  assert.equal(weekly.estimatedPricePence, 6930);
  assert.equal(Number.isInteger(weekly.estimatedPricePence), true);
});
test("empty optional notes are omitted and dashboard attention uses the canonical mapping", () => {
  assert.equal(cleanOptionalText("   "), null);
  assert.equal(
    cleanOptionalText(" access at reception "),
    "access at reception",
  );
  assert.deepEqual(getDashboardBanner(["requested", "confirmed"]), {
    actionRequired: false,
    title: "You’re all caught up",
    copy: "Everything is running smoothly. We’ll notify you if anything needs your input.",
  });
  assert.deepEqual(
    getDashboardBanner(["requested", "awaiting_customer_confirmation"]),
    {
      actionRequired: true,
      title: "1 booking needs your approval",
      copy: "Open the booking to review and approve the revised details.",
    },
  );
  assert.deepEqual(
    getDashboardStatusCounts([
      "requested",
      "confirmed",
      "awaiting_customer_confirmation",
      "completed",
      "cancelled",
    ]),
    { active: 3, needAttention: 1, completed: 1 },
  );
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

test("Slough eligibility is deterministic and unsupported postcodes remain outside area", () => {
  assert.equal(getServiceAreaStatus("SL1 2AB"), "eligible");
  assert.equal(getServiceAreaStatus("sl3 7aa"), "eligible");
  assert.equal(getServiceAreaStatus("SW1A 1AA"), "outside_area");
});

test("workspace provisioning and RLS preserve idempotency and account isolation", () => {
  const workspace = readFileSync(
    "supabase/migrations/202607210002_workspace_repair_and_service_area.sql",
    "utf8",
  );
  const booking = readFileSync(
    "supabase/migrations/202607220004_pilot_operations.sql",
    "utf8",
  );
  assert.match(
    workspace,
    /unique index if not exists business_accounts_owner_user_idx/i,
  );
  assert.match(workspace, /pg_advisory_xact_lock/i);
  assert.match(workspace, /on conflict \(user_id\) do nothing/i);
  assert.match(workspace, /public\.is_business_member\(account_id\)/i);
  assert.match(booking, /property_account is distinct from/i);
  assert.match(booking, /property_state <> 'eligible'/i);
  assert.match(booking, /idempotency_key=request_key/i);
});
