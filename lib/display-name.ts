export function formatDisplayName(value: string | null | undefined) {
  if (!value) return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\p{L}/gu, (letter) => letter.toUpperCase())
    .replace(/\bLtd\b/g, "Ltd")
    .replace(/\bLlp\b/g, "LLP")
    .replace(/\bUk\b/g, "UK");
}
