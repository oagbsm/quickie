export function parseGbpToPence(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [pounds, pennies = ""] = normalized.split(".");
  const pence = Number(pounds) * 100 + Number(pennies.padEnd(2, "0"));
  return Number.isSafeInteger(pence) && pence > 0 ? pence : null;
}

export function formatGbpFromPence(pence: number) {
  return `£${(Number(pence) / 100).toFixed(2)}`;
}
