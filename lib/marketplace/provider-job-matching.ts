type ProviderJob = { status?: string | null; service?: string | null; service_subtype?: string | null; postcode?: string | null };
type ProviderService = { category_slug?: string | null; job_type_slug?: string | null; active?: boolean | null };
type ProviderArea = { postcode_district?: string | null; active?: boolean | null };

export function marketplaceJobDistrict(postcode: string | null | undefined) {
  const raw = String(postcode || "").trim().toUpperCase();
  if (!raw) return "";

  // Marketplace areas are districts (for example, SL8), while jobs normally
  // store a full postcode. Handle partial postcodes and inconsistent spacing
  // without using the public SEO launch list as an eligibility gate.
  const candidate = /\s/.test(raw) ? raw.split(/\s+/)[0] : raw.length > 3 ? raw.slice(0, -3) : raw;
  return candidate.match(/^[A-Z]{1,2}\d{1,2}/)?.[0] || "";
}

export const marketplaceAreaDistrict = marketplaceJobDistrict;

export function isMarketplaceJobMatch(job: ProviderJob, services: ProviderService[], areas: ProviderArea[]) {
  if (!job.status || !["posted", "finding_provider"].includes(job.status)) return false;
  if (!job.service || !job.service_subtype) return false;
  const jobDistrict = marketplaceJobDistrict(job.postcode);
  if (!jobDistrict) return false;
  const serviceMatch = services.some((service) => service.active !== false && String(service.category_slug || "").trim().toLowerCase() === String(job.service || "").trim().toLowerCase() && String(service.job_type_slug || "").trim().toLowerCase() === String(job.service_subtype || "").trim().toLowerCase());
  const areaMatch = areas.some((area) => area.active !== false && marketplaceAreaDistrict(area.postcode_district) === jobDistrict);
  return serviceMatch && areaMatch;
}
