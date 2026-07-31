import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CalendarFetchError,
  fetchCalendarText,
  isBlockedCalendarAddress,
  validateCalendarUrl,
} from "../lib/calendar/safe-fetch-core.ts";
import { parseCalendar } from "../lib/calendar/parser.ts";
import {
  calendarUrlFingerprint,
  decryptCalendarUrl,
  encryptCalendarUrl,
  maskCalendarUrl,
} from "../lib/calendar/secrets-core.ts";
import { initialCalendarActionState } from "../lib/calendar/action-state.ts";

const migration = readFileSync(
  new URL(
    "../supabase/migrations/202607270003_property_calendar_sync.sql",
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
  new URL("../lib/server/property-calendars.ts", import.meta.url),
  "utf8",
);
const sourceComponent = readFileSync(
  new URL(
    "../app/business/properties/[id]/CalendarSources.tsx",
    import.meta.url,
  ),
  "utf8",
);
const calendarActions = readFileSync(
  new URL(
    "../app/business/properties/calendar-actions.ts",
    import.meta.url,
  ),
  "utf8",
);
const propertyPage = readFileSync(
  new URL("../app/business/properties/[id]/page.tsx", import.meta.url),
  "utf8",
);

const publicResolver = async () => ["93.184.216.34"];
const calendar = (events: string) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}\r\nEND:VCALENDAR`;
const event = (body: string) => `BEGIN:VEVENT\r\n${body}\r\nEND:VEVENT`;
const options = {
  connectionId: "00000000-0000-4000-8000-000000000001",
  provider: "airbnb" as const,
  defaultCheckInTime: "15:00",
  defaultCheckOutTime: "11:00",
};

test("calendar URL validation accepts public HTTPS URLs", async () => {
  assert.equal(validateCalendarUrl("https://example.com/calendar.ics").protocol, "https:");
  const result = await fetchCalendarText("https://example.com/calendar.ics", {
    resolve: publicResolver,
    fetch: async () => new Response(calendar(""), { headers: { "content-type": "text/calendar" } }),
  });
  assert.match(result, /VCALENDAR/);
});

test("calendar fetch accepts GitHub Raw text/plain calendar responses", async () => {
  const result = await fetchCalendarText("https://raw.githubusercontent.com/feed.ics", {
    resolve: publicResolver,
    fetch: async () =>
      new Response(calendar(""), {
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
  });
  assert.match(result, /^BEGIN:VCALENDAR/);
});

test("calendar secrets are encrypted, fingerprinted and masked", () => {
  const previous = process.env.CALENDAR_URL_ENCRYPTION_KEY;
  process.env.CALENDAR_URL_ENCRYPTION_KEY = "test-only-calendar-key-with-at-least-32-characters";
  try {
    const raw = "https://www.example.com/private/token-value.ics";
    const encrypted = encryptCalendarUrl(raw);
    assert.notEqual(encrypted, raw);
    assert.doesNotMatch(encrypted, /token-value/);
    assert.equal(decryptCalendarUrl(encrypted), raw);
    assert.match(calendarUrlFingerprint(raw), /^[0-9a-f]{64}$/);
    assert.equal(maskCalendarUrl(raw), "example.com/calendar/••••••••");
  } finally {
    if (previous === undefined) delete process.env.CALENDAR_URL_ENCRYPTION_KEY;
    else process.env.CALENDAR_URL_ENCRYPTION_KEY = previous;
  }
});

test("calendar actions start with and return a stable state contract", () => {
  assert.deepEqual(initialCalendarActionState, {
    status: "idle",
    message: "",
    summary: "",
    fieldErrors: {},
  });
  assert.match(calendarActions, /Promise<CalendarActionState>/);
  assert.match(calendarActions, /fieldErrors: \{\}/);
  assert.match(calendarActions, /status: "error"/);
  assert.match(calendarActions, /status: "success"/);
});

test("calendar URL validation rejects unsafe protocols, hosts and credentials", () => {
  for (const [url, code] of [
    ["http://example.com/feed.ics", "unsupported_protocol"],
    ["https://localhost/feed.ics", "calendar_address_blocked"],
    ["https://127.0.0.1/feed.ics", "calendar_address_blocked"],
    ["https://10.0.0.1/feed.ics", "calendar_address_blocked"],
    ["https://169.254.169.254/latest", "calendar_address_blocked"],
    ["https://[::1]/feed.ics", "calendar_address_blocked"],
    ["https://user:password@example.com/feed.ics", "invalid_calendar_url"],
  ] as const) {
    assert.throws(
      () => validateCalendarUrl(url),
      (error) => error instanceof CalendarFetchError && error.code === code,
      url,
    );
  }
  for (const address of ["172.16.0.1", "192.168.1.1", "fe80::1", "fd00::1"])
    assert.equal(isBlockedCalendarAddress(address), true, address);
});

test("calendar redirects are revalidated and private destinations are rejected", async () => {
  let requests = 0;
  await assert.rejects(
    fetchCalendarText("https://example.com/feed.ics", {
      resolve: async (hostname) =>
        hostname === "private.example" ? ["10.0.0.2"] : ["93.184.216.34"],
      fetch: async () => {
        requests += 1;
        return new Response(null, {
          status: 302,
          headers: { location: "https://private.example/feed.ics" },
        });
      },
    }),
    (error) =>
      error instanceof CalendarFetchError &&
      error.code === "calendar_address_blocked",
  );
  assert.equal(requests, 1);
});

test("the production fetch path pins the connection to a validated address", () => {
  const source = readFileSync(
    new URL("../lib/calendar/safe-fetch-core.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /hostname: address/);
  assert.match(source, /servername: url\.hostname/);
  assert.match(source, /addresses\[0\]/);
});

test("calendar redirect limits, timeouts and response size limits are enforced", async () => {
  await assert.rejects(
    fetchCalendarText(
      "https://example.com/feed.ics",
      {
        resolve: publicResolver,
        fetch: async () =>
          new Response(null, { status: 302, headers: { location: "/next.ics" } }),
      },
      { maxRedirects: 1 },
    ),
    (error) =>
      error instanceof CalendarFetchError &&
      error.code === "calendar_redirect_limit",
  );
  await assert.rejects(
    fetchCalendarText(
      "https://example.com/feed.ics",
      {
        resolve: publicResolver,
        fetch: async (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
          }),
      },
      { timeoutMs: 5 },
    ),
    (error) =>
      error instanceof CalendarFetchError && error.code === "calendar_timeout",
  );
  await assert.rejects(
    fetchCalendarText(
      "https://example.com/feed.ics",
      {
        resolve: publicResolver,
        fetch: async () =>
          new Response("x".repeat(100), {
            headers: { "content-type": "text/calendar" },
          }),
      },
      { maxBytes: 20 },
    ),
    (error) =>
      error instanceof CalendarFetchError && error.code === "calendar_too_large",
  );
  await assert.rejects(
    fetchCalendarText("https://example.com/feed.ics", {
      resolve: publicResolver,
      fetch: async () =>
        new Response("<html>not a calendar</html>", {
          headers: { "content-type": "text/html" },
        }),
    }),
    (error) =>
      error instanceof CalendarFetchError &&
      error.code === "calendar_content_type",
  );
});

test("parser handles folded lines, UTC, London TZID and floating timestamps", () => {
  const parsed = parseCalendar(
    calendar(
      [
        event("UID:utc\r\nDTSTART:20260801T140000Z\r\nDTEND:20260804T100000Z\r\nSUMMARY:Airbnb res\r\n ervation"),
        event("UID:london\r\nDTSTART;TZID=Europe/London:20260805T150000\r\nDTEND;TZID=Europe/London:20260807T110000"),
        event("UID:floating\r\nDTSTART:20260808T150000\r\nDTEND:20260810T110000"),
      ].join("\r\n"),
    ),
    options,
  );
  assert.equal(parsed.events.length, 3);
  assert.equal(parsed.events[0].checkInAt, "2026-08-01T14:00:00.000Z");
  assert.equal(parsed.events[1].checkInAt, "2026-08-05T14:00:00.000Z");
  assert.equal(parsed.events[2].checkOutAt, "2026-08-10T10:00:00.000Z");
  assert.equal(parsed.events[0].safeDisplayTitle, "Airbnb reservation");
});

test("all-day events use property times and iCalendar exclusive DTEND", () => {
  const parsed = parseCalendar(
    calendar(event("UID:all-day\r\nDTSTART;VALUE=DATE:20260801\r\nDTEND;VALUE=DATE:20260804")),
    options,
  );
  assert.equal(parsed.events[0].checkInAt, "2026-08-01T14:00:00.000Z");
  assert.equal(parsed.events[0].checkOutAt, "2026-08-04T10:00:00.000Z");
});

test("parser rejects missing identity and invalid ranges without losing valid events", () => {
  const parsed = parseCalendar(
    calendar(
      [
        event("DTSTART:20260801T140000Z\r\nDTEND:20260804T100000Z"),
        event("UID:bad-range\r\nDTSTART:20260804T100000Z\r\nDTEND:20260801T140000Z"),
        event("UID:good\r\nDTSTART:20260810T140000Z\r\nDTEND:20260812T100000Z"),
      ].join("\r\n"),
    ),
    options,
  );
  assert.deepEqual(parsed.issues.map((issue) => issue.code), ["missing_uid", "invalid_range"]);
  assert.deepEqual(parsed.events.map((item) => item.externalUid), ["good"]);
});

test("parser normalises cancellation, sequence, modified time and duplicate UIDs", () => {
  const parsed = parseCalendar(
    calendar(
      [
        event("UID:duplicate\r\nSEQUENCE:1\r\nDTSTART:20260801T140000Z\r\nDTEND:20260804T100000Z"),
        event("UID:duplicate\r\nSEQUENCE:2\r\nSTATUS:CANCELLED\r\nLAST-MODIFIED:20260727T120000Z\r\nDTSTART:20260801T140000Z\r\nDTEND:20260805T100000Z"),
      ].join("\r\n"),
    ),
    options,
  );
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].sequence, 2);
  assert.equal(parsed.events[0].status, "cancelled");
  assert.equal(parsed.events[0].externalLastModifiedAt, "2026-07-27T12:00:00.000Z");
  assert.equal(parsed.issues[0].code, "duplicate_uid");
});

test("parser gives recurrence instances stable identities and ignores obvious blockers", () => {
  const parsed = parseCalendar(
    calendar(
      [
        event("UID:series\r\nRECURRENCE-ID:20260801T140000Z\r\nDTSTART:20260801T140000Z\r\nDTEND:20260803T100000Z"),
        event("UID:blocker\r\nSUMMARY:Owner block\r\nDTSTART:20260804T140000Z\r\nDTEND:20260805T100000Z"),
      ].join("\r\n"),
    ),
    options,
  );
  assert.equal(parsed.events.length, 1);
  assert.equal(parsed.events[0].externalUid, "series::20260801T140000Z");
  assert.equal(parsed.events[0].recurrenceId, "20260801T140000Z");
});

test("migration preserves manual rows and defines tenant-safe source identity", () => {
  assert.match(migration, /create table public\.property_calendar_connections/);
  assert.match(migration, /calendar_url_encrypted text not null/);
  assert.match(migration, /create unique index property_calendar_connection_url_unique/);
  assert.match(migration, /add column if not exists source_connection_id uuid/);
  assert.match(migration, /reservations_ical_external_identity_unique/);
  assert.match(migration, /where source_connection_id is not null/);
  assert.match(migration, /property_calendar_connections_safe/);
  assert.doesNotMatch(
    migration.match(/create or replace view public\.property_calendar_connections_safe[\s\S]*?revoke all/)?.[0] || "",
    /calendar_url_encrypted/,
  );
  assert.match(migration, /members view calendar sync issues/);
});

test("database reconciliation reuses Sprint 1A turnover lifecycle and cautious missing policy", () => {
  assert.match(migration, /function public\.reconcile_ical_reservation/);
  assert.match(migration, /public\.sync_turnover_for_reservation/);
  assert.match(migration, /public\.refresh_reservation_turnovers_for_property/);
  assert.match(migration, /source_connection_id = connection\.id and external_uid = uid/);
  assert.match(migration, /missing_sync_count \+ 1 < 2/);
  assert.match(migration, /event_status = 'cancelled'/);
  assert.match(migration, /event_sequence < existing\.external_sequence/);
  assert.match(migration, /connection\.created_by/);
  assert.match(migration, /calendar_sync_actor_unavailable/);
  assert.match(overlapMigration, /message = 'reservation_overlap'/);
  assert.match(
    service,
    /if \(!parsed\.issues\.length && !suspiciousTruncation\)/,
  );
  assert.match(service, /suspicious_empty_feed/);
  assert.match(service, /suspiciousTruncation/);
  assert.match(service, /claim_property_calendar_sync/);
});

test("property source component has accessible actions and never renders a raw URL", () => {
  assert.match(sourceComponent, /Connect reservation source/);
  assert.match(sourceComponent, /Connect and sync/);
  assert.match(sourceComponent, /Syncing…/);
  assert.match(sourceComponent, /masked_calendar_url/);
  assert.doesNotMatch(sourceComponent, /calendar_url_encrypted|calendarUrlFingerprint/);
});

test("property creation redirects to a visible calendar setup panel", () => {
  assert.match(propertyPage, /created\?: string/);
  assert.match(propertyPage, /created === "1"/);
  assert.match(propertyPage, /Property created successfully/);
  assert.match(propertyPage, /Connect reservation source/);
  assert.match(
    readFileSync(new URL("../app/business/actions.ts", import.meta.url), "utf8"),
    /`\/business\/properties\/\$\{created\?\.id\}\?created=1`/,
  );
});
