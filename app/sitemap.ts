import type { MetadataRoute } from "next";

const SITE_URL = "https://www.quickola.co.uk";

const pages = [
  "/",
  "/product",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookies",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return pages.map((path) => ({
    url: `${SITE_URL}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/product" ? 0.9 : 0.7,
  }));
}
