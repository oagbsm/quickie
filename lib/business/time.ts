export const BUSINESS_TIME_ZONE = "Europe/London";
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
  return hours >= 7 && hours <= 20 && [0, 30].includes(minutes);
}
export function londonLocalToUtc(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time))
    throw new Error("invalid_local_datetime");
  const [y, m, d] = date.split("-").map(Number),
    [hour, minute] = time.split(":").map(Number),
    desired = Date.UTC(y, m - 1, d, hour, minute);
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
  return new Date(guess);
}
