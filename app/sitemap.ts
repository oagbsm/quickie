import type { MetadataRoute } from "next";
import { getAllSeoSlugs } from "@/lib/seoPages";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.quickola.co.uk";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const seoPages: MetadataRoute.Sitemap = getAllSeoSlugs().map((slug) => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: slug === "cleaning-london" ? 0.9 : 0.7,
  }));

  return [...staticPages, ...seoPages];
}