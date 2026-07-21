import type { MetadataRoute } from "next";

const SITE_URL = "https://quickola.co.uk";

const pages = [
  "/",
  "/cleaners-slough",
  "/regular-cleaner-slough",
  "/deep-cleaning-slough",
  "/end-of-tenancy-cleaning-slough",
  "/airbnb-cleaning-slough",
  "/after-builders-cleaning-slough",
  "/business",
  "/about",
  "/trust-safety",
  "/pricing-methodology",
  "/contact",
  "/slough/burnham/cleaner",
  "/slough/chalvey/cleaner",
  "/slough/cippenham/cleaner",
  "/slough/farnham-royal/cleaner",
  "/slough/langley/cleaner",
  "/slough/upton/cleaner",
  "/slough/wexham/cleaner",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return pages.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority:
      path === "/"
        ? 1
        : path.startsWith("/slough/") && path.endsWith("/cleaner")
          ? 0.85
          : 0.9,
  }));
}
