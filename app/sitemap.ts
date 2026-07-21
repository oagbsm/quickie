import type { MetadataRoute } from "next";

const SITE_URL = "https://quickola.co.uk";

const pages = [
  "/",
  "/business/enquire",
  "/about",
  "/trust-safety",
  "/pricing-methodology",
  "/contact",
  "/privacy-policy",
  "/business/legal/terms",
  "/business/legal/cancellation",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return pages.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : path === "/business/enquire" ? 0.95 : 0.7,
  }));
}
