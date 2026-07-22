import type { MetadataRoute } from "next";

const SITE_URL = "https://www.quickola.co.uk";

const pages = [
  "/",
  "/business/enquire",
  "/product",
  "/how-it-works",
  "/service-area",
  "/solutions/letting-agents",
  "/solutions/airbnb",
  "/solutions/offices",
  "/about",
  "/trust-safety",
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
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : path === "/business/enquire" ? 0.95 : 0.7,
  }));
}
