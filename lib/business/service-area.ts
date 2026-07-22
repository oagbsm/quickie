export function getServiceAreaStatus(postcode: string) {
  return /^(SL1|SL2|SL3)/.test(postcode.toUpperCase().replace(/\s+/g, ""))
    ? "eligible"
    : "outside_area";
}
