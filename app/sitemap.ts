import type { MetadataRoute } from "next";
import { ACTIVE_PUBLIC_SEO_LOCATIONS, marketplaceLocations, marketplaceServices } from "@/app/data/marketplace";

const SITE_URL = "https://www.quickola.co.uk";

const pages = [
  "/",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/services",
  "/locations",
  "/help",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const servicePages = marketplaceServices.map((service) => `/services/${service.slug}`);
  const activeLocations = marketplaceLocations.filter((location) => ACTIVE_PUBLIC_SEO_LOCATIONS.includes(location.slug as (typeof ACTIVE_PUBLIC_SEO_LOCATIONS)[number]));
  const locationPages = activeLocations.map((location) => `/locations/${location.slug}`);
  const localPages = marketplaceServices.flatMap((service) => activeLocations.map((location) => `/services/${service.slug}/${location.slug}`));
  return [...pages, ...servicePages, ...locationPages, ...localPages].map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/services" || path === "/locations" ? 0.9 : 0.7,
  }));
}
