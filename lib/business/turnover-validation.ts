export const TURNOVER_DURATION_OPTIONS = [
  { value: 60, label: "1h" },
  { value: 90, label: "1.5h" },
  { value: 120, label: "2h" },
  { value: 150, label: "2.5h" },
  { value: 180, label: "3h" },
  { value: 210, label: "3.5h" },
  { value: 240, label: "4h" },
  { value: 300, label: "5+" },
] as const;

export function isSupportedTurnoverDuration(value: number) {
  return TURNOVER_DURATION_OPTIONS.some((option) => option.value === value);
}

export function formatTurnoverDuration(value: string | number | undefined) {
  return TURNOVER_DURATION_OPTIONS.find((option) => option.value === Number(value))?.label || "—";
}

export function formatTurnoverDurationLong(value: string | number | undefined) {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return "—";
  if (minutes === 300) return "5+ hours";
  const hours = minutes / 60;
  return `${hours} ${hours === 1 ? "hour" : "hours"}`;
}
