export const BUSINESS_TIME_ZONE = "Europe/London";
export const PILOT_SCHEDULE = {
  operatingDays: [1, 2, 3, 4, 5, 6],
  opensAtHour: 8,
  closesAtHour: 18,
  latestStartHour: 16,
  slotMinutes: 60,
  minimumLeadMinutes: 24 * 60,
  closedDates: [] as string[],
} as const;
export function formatBusinessDateTime(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: BUSINESS_TIME_ZONE,
  }).format(new Date(value));
}
export function isPracticalBookingTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  const hours = Number(match[1]),
    minutes = Number(match[2]);
  return (
    hours >= PILOT_SCHEDULE.opensAtHour &&
    hours <= PILOT_SCHEDULE.latestStartHour &&
    minutes === 0
  );
}

export function getPilotStartTimes(durationMinutes: number) {
  const latestByDuration = Math.floor(
    PILOT_SCHEDULE.closesAtHour - durationMinutes / 60,
  );
  const latest = Math.min(PILOT_SCHEDULE.latestStartHour, latestByDuration);
  return Array.from(
    { length: Math.max(0, latest - PILOT_SCHEDULE.opensAtHour + 1) },
    (_, index) =>
      `${String(PILOT_SCHEDULE.opensAtHour + index).padStart(2, "0")}:00`,
  );
}

export function validatePilotSchedule(
  date: string,
  time: string,
  durationMinutes: number,
  now = new Date(),
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isPracticalBookingTime(time))
    return { ok: false as const, reason: "invalid_slot" };
  if (PILOT_SCHEDULE.closedDates.includes(date))
    return { ok: false as const, reason: "closed_date" };
  const requested = londonLocalToUtc(date, time);
  if (Number.isNaN(requested.getTime()))
    return { ok: false as const, reason: "invalid_slot" };
  const dayName = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "short",
  }).format(requested);
  const londonWeekday = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(dayName);
  if (
    !PILOT_SCHEDULE.operatingDays.includes(
      londonWeekday as 1 | 2 | 3 | 4 | 5 | 6,
    )
  )
    return { ok: false as const, reason: "closed_day" };
  if (!getPilotStartTimes(durationMinutes).includes(time))
    return { ok: false as const, reason: "duration_outside_hours" };
  if (
    requested.getTime() - now.getTime() <
    PILOT_SCHEDULE.minimumLeadMinutes * 60_000
  )
    return { ok: false as const, reason: "lead_time" };
  return { ok: true as const, scheduledStart: requested };
}
export function londonLocalToUtc(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("invalid_local_datetime");
  const [y, m, d] = date.split("-").map(Number),
    [hour, minute] = time.split(":").map(Number),
    desired = Date.UTC(y, m - 1, d, hour, minute);
  if (
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  )
    throw new Error("invalid_local_datetime");
  let guess = desired;
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((p) => p.type === type)?.value);
    const represented = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
    );
    guess += desired - represented;
  }
  const result = new Date(guess);
  const roundTrip = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(result);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(roundTrip.find((part) => part.type === type)?.value);
  if (
    value("year") !== y ||
    value("month") !== m ||
    value("day") !== d ||
    value("hour") !== hour ||
    value("minute") !== minute
  )
    throw new Error("invalid_local_datetime");
  return result;
}

export function londonFormDateTime(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return {
    date: `${part("year")}-${part("month")}-${part("day")}`,
    time: `${part("hour")}:${part("minute")}`,
  };
}
