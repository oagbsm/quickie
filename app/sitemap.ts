import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { serviceDropdownOrder } from "./data/serviceFormConfigs";
import { seoAreaParams } from "./data/seoLocations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = "https://quickola.co.uk";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const staticPages: MetadataRoute.Sitemap = [
      {
        url: siteUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
    ];

    const localServicePages: MetadataRoute.Sitemap = seoAreaParams.flatMap(
      ({ location, area }) =>
        serviceDropdownOrder.map((service) => ({
          url: `${siteUrl}/${location}/${area}/${service}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.85,
        }))
    );

    return [...staticPages, ...localServicePages];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: pages, error } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .eq("indexable", true)
    .eq("status", "published")
    .order("slug", { ascending: true });

  if (error) {
    console.error("Sitemap SEO pages error:", error);
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const localServicePages: MetadataRoute.Sitemap = seoAreaParams.flatMap(
    ({ location, area }) =>
      serviceDropdownOrder.map((service) => ({
        url: `${siteUrl}/${location}/${area}/${service}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.85,
      }))
  );

  const seoPages: MetadataRoute.Sitemap =
    pages?.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    })) ?? [];

  return [...staticPages, ...localServicePages, ...seoPages];
}