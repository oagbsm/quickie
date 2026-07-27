import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  londonFormDateTime,
  londonLocalToUtc,
} from "../lib/business/time.ts";
import {
  formatReservationEvent,
  isSameLondonDate,
} from "../lib/reservations/presentation.ts";
import {
  initialReservationActionState,
  reservationFieldError,
  type ReservationActionState,
} from "../lib/reservations/action-state.ts";
import {
  executeReservationMutation,
  executeReservationSubmission,
} from "../lib/reservations/action-execution.ts";
import { validateReservationInput } from "../lib/reservations/validation.ts";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/202607270001_manual_reservation_engine.sql",
    import.meta.url,
  ),
  "utf8",
);
const overlapMigration = readFileSync(
  new URL(
    "../supabase/migrations/202607270002_prevent_reservation_overlaps.sql",
    import.meta.url,
  ),
  "utf8",
);
const service = readFileSync(
  new URL("../lib/server/reservations.ts", import.meta.url),
  "utf8",
);
const detailPage = readFileSync(
  new URL("../app/business/reservations/[id]/page.tsx", import.meta.url),
  "utf8",
);
const reservationForm = readFileSync(
  new URL("../app/business/reservations/ReservationForm.tsx", import.meta.url),
  "utf8",
);
const newReservationPage = readFileSync(
  new URL("../app/business/reservations/new/page.tsx", import.meta.url),
  "utf8",
);
const editReservationPage = readFileSync(
  new URL(
    "../app/business/reservations/[id]/edit/page.tsx",
    import.meta.url,
  ),
  "utf8",
);

const valid = {
  propertyId: "90a58782-ea52-4aca-98b3-7f04065e20ce",
  guestName: "Alex Guest",
  guestCount: "3",
  checkInDate: "2026-08-04",
  checkInTime: "15:00",
  checkOutDate: "2026-08-07",
  checkOutTime: "11:00",
};

type TestStay = {
  checkIn: number;
  checkOut: number;
  status?: "confirmed" | "cancelled";
};

const overlaps = (candidate: TestStay, existing: TestStay) =>
  existing.status !== "cancelled" &&
  candidate.checkIn < existing.checkOut &&
  candidate.checkOut > existing.checkIn;

test("manual reservation input is converted from Europe/London without shifting local time", () => {
  const result = validateReservationInput(valid);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.checkInAt, "2026-08-04T14:00:00.000Z");
  assert.equal(result.value.checkOutAt, "2026-08-07T10:00:00.000Z");
  assert.deepEqual(londonFormDateTime(result.value.checkInAt), {
    date: "2026-08-04",
    time: "15:00",
  });
});

test("reservation forms start with a complete empty action state", () => {
  assert.deepEqual(initialReservationActionState, {
    status: "idle",
    message: "",
    fieldErrors: {},
  });
  assert.match(reservationForm, /from "@\/lib\/reservations\/action-state"/);
  assert.match(
    reservationForm,
    /useActionState\([\s\S]*initialReservationActionState/,
  );
  assert.match(newReservationPage, /<ReservationForm[\s\S]*mode="create"/);
  assert.match(editReservationPage, /<ReservationForm[\s\S]*mode="edit"/);
});

test("reservation submission returns complete validation failure state", async () => {
  let submitted = false;
  const outcome = await executeReservationSubmission(
    { ...valid, propertyId: "invalid" },
    async () => {
      submitted = true;
      return { reservationId: "unused" };
    },
    () => "Database failure",
  );
  assert.equal(outcome.ok, false);
  assert.equal(submitted, false);
  assert.equal(outcome.state.status, "error");
  assert.match(outcome.state.message, /highlighted reservation details/i);
  assert.match(
    reservationFieldError(outcome.state, "propertyId") || "",
    /valid property/i,
  );
  assert.deepEqual(Object.keys(outcome.state).sort(), [
    "fieldErrors",
    "message",
    "status",
  ]);
});

test("reservation submission returns complete database failure state", async () => {
  const outcome = await executeReservationSubmission(
    valid,
    async () => {
      throw new Error("database unavailable");
    },
    () => "The reservation could not be saved. Try again.",
  );
  assert.equal(outcome.ok, false);
  assert.deepEqual(outcome.state, {
    status: "error",
    message: "The reservation could not be saved. Try again.",
    fieldErrors: {},
  });
});

test("successful reservation submission returns complete success state", async () => {
  const value = { reservationId: "reservation-1" };
  const outcome = await executeReservationSubmission(
    valid,
    async () => value,
    () => "Unexpected failure",
  );
  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.state, {
    status: "success",
    message: "",
    fieldErrors: {},
  });
  assert.equal(outcome.value, value);
});

test("cancellation failure returns the same complete action state shape", async () => {
  const outcome = await executeReservationMutation(
    async () => {
      throw new Error("cancellation database failure");
    },
    () => "The reservation could not be saved. Try again.",
  );
  assert.equal(outcome.ok, false);
  assert.deepEqual(outcome.state, {
    status: "error",
    message: "The reservation could not be saved. Try again.",
    fieldErrors: {},
  });
});

test("field error access is defensive and preserves string arrays", () => {
  assert.equal(reservationFieldError(undefined, "propertyId"), undefined);
  const state: ReservationActionState = {
    status: "error",
    message: "Review the highlighted reservation details.",
    fieldErrors: {
      propertyId: ["Select a property.", "The property must be active."],
    },
  };
  assert.equal(
    reservationFieldError(state, "propertyId"),
    "Select a property. The property must be active.",
  );
});

test("non-existent London times during the spring DST transition are rejected", () => {
  assert.throws(
    () => londonLocalToUtc("2026-03-29", "01:30"),
    /invalid_local_datetime/,
  );
  const result = validateReservationInput({
    ...valid,
    checkInDate: "2026-03-29",
    checkInTime: "01:30",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(
    reservationFieldError(
      { status: "error", message: result.message, fieldErrors: result.fieldErrors },
      "checkInTime",
    ) || "",
    /clocks change/i,
  );
});

test("invalid ranges, malformed property IDs and guest counts are rejected", () => {
  const result = validateReservationInput({
    ...valid,
    propertyId: "not-a-uuid",
    guestCount: "0",
    checkOutDate: "2026-08-03",
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  const state: ReservationActionState = {
    status: "error",
    message: result.message,
    fieldErrors: result.fieldErrors,
  };
  assert.match(reservationFieldError(state, "propertyId") || "", /valid property/i);
  assert.match(
    reservationFieldError(state, "guestCount") || "",
    /positive whole number/i,
  );
  assert.match(reservationFieldError(state, "checkOutDate") || "", /after check-in/i);
});

test("reservation overlap interval cases use half-open stay ranges", () => {
  const existing = { checkIn: 10, checkOut: 20 };
  const cases: Array<[string, TestStay, boolean]> = [
    ["exact duplicate dates", { checkIn: 10, checkOut: 20 }, true],
    ["partial overlap at start", { checkIn: 5, checkOut: 15 }, true],
    ["partial overlap at end", { checkIn: 15, checkOut: 25 }, true],
    ["fully contained reservation", { checkIn: 12, checkOut: 18 }, true],
    ["reservation containing another", { checkIn: 5, checkOut: 25 }, true],
    ["back-to-back before", { checkIn: 5, checkOut: 10 }, false],
    ["back-to-back after", { checkIn: 20, checkOut: 25 }, false],
  ];
  for (const [label, candidate, expected] of cases)
    assert.equal(overlaps(candidate, existing), expected, label);
  assert.equal(
    overlaps(existing, { ...existing, status: "cancelled" }),
    false,
    "cancelled reservations are ignored",
  );
});

test("database atomically rejects active property overlaps before turnover work", () => {
  assert.match(overlapMigration, /before insert or update of[\s\S]*on public\.reservations/);
  assert.match(overlapMigration, /candidate\.status <> 'cancelled'/);
  assert.match(overlapMigration, /candidate\.id <> new\.id/);
  assert.match(
    overlapMigration,
    /new\.check_in_at < candidate\.check_out_at[\s\S]*new\.check_out_at > candidate\.check_in_at/,
  );
  assert.match(overlapMigration, /pg_advisory_xact_lock/);
  assert.match(overlapMigration, /reservation-overlap:[\s\S]*new\.property_id/);
  assert.match(overlapMigration, /message = 'reservation_overlap'/);
  assert.match(service, /This reservation overlaps with an existing reservation/);
  assert.match(service, /The existing stay runs from/);
});

test("edit conflict checks exclude the edited reservation but reject a new conflict", () => {
  const self = { checkIn: 10, checkOut: 20 };
  assert.equal(overlaps(self, self), true, "time comparison alone overlaps itself");
  assert.match(overlapMigration, /candidate\.id <> new\.id/);
  assert.equal(
    overlaps({ checkIn: 18, checkOut: 25 }, { checkIn: 10, checkOut: 20 }),
    true,
    "an edit moving into another stay conflicts",
  );
});

test("reservation status is current state while modification is an event", () => {
  assert.match(migration, /status in \('confirmed', 'cancelled', 'completed'\)/);
  assert.doesNotMatch(migration, /status in \([^)]*modified/);
  assert.match(migration, /'reservation\.updated'/);
});

test("one source reference and one linked turnover are enforced per tenant", () => {
  assert.match(
    migration,
    /reservations_source_reference_unique[\s\S]*account_id, source, external_reservation_id/,
  );
  assert.match(
    migration,
    /work_items_one_per_reservation_idx[\s\S]*on public\.work_items\(reservation_id\)[\s\S]*where reservation_id is not null/,
  );
  assert.match(
    migration,
    /foreign key\(reservation_id, property_id, account_id\)[\s\S]*references public\.reservations\(id, property_id, account_id\)/,
  );
});

test("reservation creation, synchronisation and cancellation are atomic database operations", () => {
  for (const operation of [
    "create_manual_reservation",
    "update_manual_reservation",
    "cancel_manual_reservation",
    "sync_turnover_for_reservation",
  ])
    assert.match(migration, new RegExp(`function public\\.${operation}`));
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /external_reference := 'manual:' \|\| request_key/);
  assert.match(migration, /work_items[\s\S]*reservation_id/);
  assert.match(migration, /if reservation\.status = 'cancelled'/);
  assert.match(migration, /if item\.status <> 'cancelled'/);
});

test("reservation and event reads are tenant isolated while writes use guarded RPCs", () => {
  assert.match(
    migration,
    /members view reservations[\s\S]*public\.is_business_member\(account_id\)/,
  );
  assert.match(
    migration,
    /members view reservation events[\s\S]*public\.is_business_member\(account_id\)/,
  );
  assert.doesNotMatch(migration, /policy "members manage reservations"/);
  assert.doesNotMatch(migration, /policy "members (insert|update|delete) reservation events"/);
  assert.match(migration, /linked_turnover_cannot_be_deleted/);
  assert.match(service, /requireBusinessUser\(\)/);
  assert.match(service, /\.eq\("account_id", accountId\)/);
});

test("no-op updates and repeated cancellations do not append duplicate events", () => {
  assert.match(
    migration,
    /if new_values = '\{\}'::jsonb then[\s\S]*'changed', false/,
  );
  assert.match(
    migration,
    /if reservation\.status = 'cancelled' then[\s\S]*'changed', false/,
  );
  assert.match(
    migration,
    /if item\.status <> 'cancelled' then[\s\S]*'turnover\.cancelled'/,
  );
});

test("timeline events are chronological, human-readable and do not render JSON", () => {
  const event = {
    id: "event-1",
    sequence: 3,
    event_type: "reservation.updated",
    previous_values: { check_out_at: "2026-08-04T10:00:00.000Z" },
    new_values: { check_out_at: "2026-08-05T10:00:00.000Z" },
    metadata: {},
    created_at: "2026-07-27T10:00:00.000Z",
  };
  assert.equal(
    formatReservationEvent(event).title,
    "Check-out changed from 4 August 2026 at 11:00 to 5 August 2026 at 11:00",
  );
  assert.match(service, /\.order\("sequence", \{ ascending: true \}\)/);
  assert.doesNotMatch(detailPage, /JSON\.stringify|<pre|previous_values|new_values/);
});

test("same-day turnovers are identified in London time", () => {
  assert.equal(
    isSameLondonDate(
      "2026-08-04T10:00:00.000Z",
      "2026-08-04T14:00:00.000Z",
    ),
    true,
  );
  assert.equal(
    isSameLondonDate(
      "2026-08-04T22:30:00.000Z",
      "2026-08-05T08:00:00.000Z",
    ),
    false,
  );
});
