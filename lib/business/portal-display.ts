const londonDateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const londonDateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/London",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function compareBookingDateAscending(
  a: { scheduled_start: string },
  b: { scheduled_start: string },
) {
  return compareTimestamps(a.scheduled_start, b.scheduled_start, 1);
}

export function compareBookingDateDescending(
  a: { scheduled_start: string },
  b: { scheduled_start: string },
) {
  return compareTimestamps(a.scheduled_start, b.scheduled_start, -1);
}

export function formatCompactBookingDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return londonDateTime.format(date).replace(",", " ·");
}

export function getLondonDateKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = londonDateKey.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function formatPropertyName(value?: string | null) {
  const name = value?.trim();
  if (!name) return "Property";
  if (name === name.toLowerCase()) {
    return name.replace(/(^|[\s-])([a-z])/g, (_, separator, letter) =>
      `${separator}${letter.toUpperCase()}`,
    );
  }
  return name;
}

function compareTimestamps(a: string, b: string, direction: 1 | -1) {
  const aTimestamp = new Date(a).getTime();
  const bTimestamp = new Date(b).getTime();
  if (Number.isNaN(aTimestamp)) return Number.isNaN(bTimestamp) ? 0 : 1;
  if (Number.isNaN(bTimestamp)) return -1;
  return (aTimestamp - bTimestamp) * direction;
}
