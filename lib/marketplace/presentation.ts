export function formatMarketplaceProviderName(value: string | null | undefined) {
  const name = String(value || "").trim();
  if (!name) return "Your provider";
  const words = name.split(/\s+/);
  if (words.length <= 2 && name === name.toLowerCase() && words.every((word) => /^[a-z]+$/.test(word))) {
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }
  return name;
}
