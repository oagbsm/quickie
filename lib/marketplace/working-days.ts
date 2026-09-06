/** Add working days in UTC, excluding Saturday and Sunday. */
export function addWorkingDaysUtc(value: Date | string, workingDays: number) {
  if (!Number.isInteger(workingDays) || workingDays < 0) throw new Error("invalid_working_days");
  const result = new Date(value);
  if (Number.isNaN(result.getTime())) throw new Error("invalid_date");
  let remaining = workingDays;
  while (remaining > 0) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) remaining -= 1;
  }
  return result;
}
