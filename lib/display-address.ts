export function formatDisplayAddress(parts: Array<string | null | undefined>, fallback = "—") {
  const usable = parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim());
  return usable.length ? usable.join(", ") : fallback;
}
