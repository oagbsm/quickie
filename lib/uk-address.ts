export const UK_POSTCODE_PATTERN = /^(GIR 0AA|(?:[A-PR-UWYZ][0-9][0-9A-HJKSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9ABEHMNPRV-Y]?) ?[0-9][ABD-HJLNP-UW-Z]{2})$/i;

export function normaliseUkPostcode(value: string) {
  const compact = value.trim().toUpperCase().replace(/\s+/g, "");
  return compact.length > 3 ? `${compact.slice(0, -3)} ${compact.slice(-3)}` : compact;
}

export function isValidUkPostcode(value: string) {
  return UK_POSTCODE_PATTERN.test(normaliseUkPostcode(value));
}

export function getPostcodeDistrict(value: string) {
  const postcode = normaliseUkPostcode(value);
  return postcode.split(" ")[0] || "";
}

export function getPostcodeArea(value: string) {
  return getPostcodeDistrict(value).match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "";
}

export function normaliseAddressPart(value: string) {
  return value.trim().replace(/\s+/g, " ");
}
