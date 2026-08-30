import { ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS } from "@/app/data/marketplace";
import { getPostcodeDistrict } from "@/lib/uk-address";

type ProviderJob = { status?: string | null; service?: string | null; service_subtype?: string | null; postcode?: string | null };
type ProviderService = { category_slug?: string | null; job_type_slug?: string | null; active?: boolean | null };
type ProviderArea = { postcode_district?: string | null; active?: boolean | null };

export function marketplaceJobDistrict(postcode: string | null | undefined) {
  return getPostcodeDistrict(String(postcode || "")).toUpperCase();
}

export function isMarketplaceJobMatch(job: ProviderJob, services: ProviderService[], areas: ProviderArea[]) {
  if (!job.status || !["posted", "finding_provider"].includes(job.status)) return false;
  if (!job.service || !job.service_subtype) return false;
  if (!ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS.includes(marketplaceJobDistrict(job.postcode) as (typeof ACTIVE_PUBLIC_SEO_POSTCODE_DISTRICTS)[number])) return false;
  const serviceMatch = services.some((service) => service.active !== false && service.category_slug === job.service && service.job_type_slug === job.service_subtype);
  const areaMatch = areas.some((area) => area.active !== false && String(area.postcode_district || "").trim().toUpperCase() === marketplaceJobDistrict(job.postcode));
  return serviceMatch && areaMatch;
}
