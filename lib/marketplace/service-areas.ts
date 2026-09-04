export const MARKETPLACE_SERVICE_AREA_CODES = ["SL1", "SL2", "SL3", "SL4", "SL5", "SL6", "SL7", "SL8", "SL9"] as const;
export const ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS = ["SL6"] as const;

export function isActiveMarketplacePostcodeDistrict(value: string) {
  return ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS.includes(value.trim().toUpperCase() as (typeof ACTIVE_MARKETPLACE_POSTCODE_DISTRICTS)[number]);
}

export function normaliseMarketplaceServiceAreas(values: Iterable<string>) {
  return [...new Set(Array.from(values).map((value) => value.trim().toUpperCase()).filter((value) => /^SL[1-9]$/.test(value)))];
}

export function extractMarketplaceServiceAreas(value: string) {
  return normaliseMarketplaceServiceAreas(value.toUpperCase().match(/\b[A-Z]{1,2}\d{1,2}[A-Z]?\b/g) || []);
}
