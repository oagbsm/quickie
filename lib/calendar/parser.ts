import { createHash } from "node:crypto";
import { londonLocalToUtc } from "../business/time.ts";
import type {
  CalendarParseIssue,
  CalendarParseResult,
  CalendarProvider,
  NormalizedCalendarEvent,
} from "./types.ts";

type RawProperty = { value: string; params: Record<string, string> };
type RawEvent = Map<string, RawProperty[]>;

const safeTitles: Record<CalendarProvider, string> = {
  airbnb: "Airbnb reservation",
  booking_com: "Booking.com reservation",
  vrbo: "Vrbo reservation",
  other: "Imported reservation",
};

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");

function unfold(input: string) {
  return input.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function property(line: string): [string, RawProperty] | null {
  const colon = line.indexOf(":");
  if (colon < 1) return null;
  const head = line.slice(0, colon).split(";");
  const name = head.shift()!.toUpperCase();
  const params: Record<string, string> = {};
  for (const item of head) {
    const equals = item.indexOf("=");
    if (equals > 0)
      params[item.slice(0, equals).toUpperCase()] = item
        .slice(equals + 1)
        .replace(/^"|"$/g, "");
  }
  return [name, { value: line.slice(colon + 1), params }];
}

function partsInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function zonedDateTime(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
) {
  if (timeZone === "Europe/London")
    return londonLocalToUtc(
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    );
  const desired = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = desired;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = partsInZone(new Date(guess), timeZone);
    const represented = Date.UTC(
      shown.year,
      shown.month - 1,
      shown.day,
      shown.hour,
      shown.minute,
      shown.second,
    );
    guess += desired - represented;
  }
  const result = new Date(guess);
  const roundTrip = partsInZone(result, timeZone);
  if (
    roundTrip.year !== year ||
    roundTrip.month !== month ||
    roundTrip.day !== day ||
    roundTrip.hour !== hour ||
    roundTrip.minute !== minute
  )
    throw new Error("invalid_calendar_datetime");
  return result;
}

function parseDateTime(
  input: RawProperty,
  defaultTime: string,
  floatingTimeZone = "Europe/London",
) {
  const dateOnly = input.params.VALUE === "DATE" || /^\d{8}$/.test(input.value);
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(
    input.value,
  );
  if (!match) throw new Error("invalid_calendar_datetime");
  const [, year, month, day, rawHour, rawMinute, rawSecond, utc] = match;
  const [defaultHour, defaultMinute] = defaultTime.split(":").map(Number);
  const hour = dateOnly ? defaultHour : Number(rawHour);
  const minute = dateOnly ? defaultMinute : Number(rawMinute);
  const second = dateOnly ? 0 : Number(rawSecond || 0);
  if (utc)
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), hour, minute, second),
    );
  return zonedDateTime(
    Number(year),
    Number(month),
    Number(day),
    hour,
    minute,
    second,
    input.params.TZID || floatingTimeZone,
  );
}

function first(event: RawEvent, name: string) {
  return event.get(name)?.[0];
}

function obviousBlocker(summary: string) {
  return /^(blocked|not available|unavailable|owner block)$/i.test(summary.trim());
}

function newerEvent(
  current: NormalizedCalendarEvent,
  candidate: NormalizedCalendarEvent,
) {
  const currentSequence = current.sequence ?? -1;
  const candidateSequence = candidate.sequence ?? -1;
  if (candidateSequence !== currentSequence)
    return candidateSequence > currentSequence ? candidate : current;
  return (candidate.externalLastModifiedAt || "") >
    (current.externalLastModifiedAt || "")
    ? candidate
    : current;
}

export function parseCalendar(
  input: string,
  options: {
    connectionId: string;
    provider: CalendarProvider;
    defaultCheckInTime: string;
    defaultCheckOutTime: string;
  },
): CalendarParseResult {
  if (!/BEGIN:VCALENDAR/i.test(input) || !/END:VCALENDAR/i.test(input))
    throw new Error("invalid_calendar_format");
  const rawEvents: RawEvent[] = [];
  let current: RawEvent | null = null;
  for (const line of unfold(input)) {
    if (line.toUpperCase() === "BEGIN:VEVENT") {
      current = new Map();
      continue;
    }
    if (line.toUpperCase() === "END:VEVENT") {
      if (current) rawEvents.push(current);
      current = null;
      continue;
    }
    if (!current) continue;
    const parsed = property(line);
    if (!parsed) continue;
    const [name, value] = parsed;
    current.set(name, [...(current.get(name) || []), value]);
  }

  const issues: CalendarParseIssue[] = [];
  const byUid = new Map<string, NormalizedCalendarEvent>();
  for (const raw of rawEvents) {
    const uid = first(raw, "UID")?.value.trim();
    if (!uid) {
      issues.push({
        code: "missing_uid",
        safeMessage: "A calendar event had no stable identity and was skipped.",
        externalUidHash: null,
      });
      continue;
    }
    const recurrenceId = first(raw, "RECURRENCE-ID")?.value.trim() || null;
    const externalUid = recurrenceId ? `${uid}::${recurrenceId}` : uid;
    const summary = first(raw, "SUMMARY")?.value || "";
    if (obviousBlocker(summary)) continue;
    const dtStart = first(raw, "DTSTART");
    const dtEnd = first(raw, "DTEND");
    if (!dtStart || !dtEnd) {
      issues.push({
        code: "invalid_date",
        safeMessage: "A calendar event had incomplete dates and was skipped.",
        externalUidHash: hash(externalUid),
      });
      continue;
    }
    let checkIn: Date;
    let checkOut: Date;
    try {
      checkIn = parseDateTime(dtStart, options.defaultCheckInTime);
      checkOut = parseDateTime(dtEnd, options.defaultCheckOutTime);
    } catch {
      issues.push({
        code: "invalid_date",
        safeMessage: "A calendar event had an invalid date and was skipped.",
        externalUidHash: hash(externalUid),
      });
      continue;
    }
    if (checkOut <= checkIn) {
      issues.push({
        code: "invalid_range",
        safeMessage: "A calendar event ended before it started and was skipped.",
        externalUidHash: hash(externalUid),
      });
      continue;
    }
    const rawStatus = first(raw, "STATUS")?.value.toUpperCase() || null;
    const sequenceText = first(raw, "SEQUENCE")?.value;
    const sequence = sequenceText && /^\d+$/.test(sequenceText)
      ? Number(sequenceText)
      : null;
    const modified = first(raw, "LAST-MODIFIED") || first(raw, "CREATED");
    let externalLastModifiedAt: string | null = null;
    if (modified) {
      try {
        externalLastModifiedAt = parseDateTime(modified, "00:00").toISOString();
      } catch {
        externalLastModifiedAt = null;
      }
    }
    const meaningful = {
      externalUid,
      checkInAt: checkIn.toISOString(),
      checkOutAt: checkOut.toISOString(),
      status: rawStatus === "CANCELLED" ? "cancelled" : "confirmed",
      sequence,
      externalLastModifiedAt,
    } as const;
    const normalized: NormalizedCalendarEvent = {
      connectionId: options.connectionId,
      provider: options.provider,
      fingerprint: hash(JSON.stringify(meaningful)),
      safeDisplayTitle: safeTitles[options.provider],
      recurrenceId,
      rawSourceStatus: rawStatus,
      ...meaningful,
    };
    const duplicate = byUid.get(externalUid);
    if (duplicate) {
      issues.push({
        code: "duplicate_uid",
        safeMessage: "A repeated calendar event identity was resolved safely.",
        externalUidHash: hash(externalUid),
      });
      byUid.set(externalUid, newerEvent(duplicate, normalized));
    } else {
      byUid.set(externalUid, normalized);
    }
  }
  return { events: [...byUid.values()], issues, eventCount: rawEvents.length };
}
