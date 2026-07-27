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
import { validateReservationInput } from "../lib/reservations/validation.ts";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/202607270001_manual_reservation_engine.sql",
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

const valid = {
  propertyId: "90a58782-ea52-4aca-98b3-7f04065e20ce",
  guestName: "Alex Guest",
  guestCount: "3",
  checkInDate: "2026-08-04",
  checkInTime: "15:00",
  checkOutDate: "2026-08-07",
  checkOutTime: "11:00",
};

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
  assert.match(result.fieldErrors.checkInTime || "", /clocks change/i);
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
  assert.match(result.fieldErrors.propertyId || "", /valid property/i);
  assert.match(result.fieldErrors.guestCount || "", /positive whole number/i);
  assert.match(result.fieldErrors.checkOutDate || "", /after check-in/i);
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
