import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const baseUrl = "https://www.quickola.co.uk";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  const supabase = getSupabaseClient();

  if (!supabase) {
    return staticPages;
  }

  const { data, error } = await supabase
    .from("seo_pages")
    .select("slug, updated_at")
    .eq("status", "published")
    .eq("indexable", true)
    .order("slug", { ascending: true });

  if (error || !data) {
    console.error("Failed to load sitemap SEO pages:", error);
    return staticPages;
  }

  const seoPages: MetadataRoute.Sitemap = data.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: page.slug === "cleaning-london" ? 0.9 : page.slug.startsWith("cleaning-") ? 0.8 : 0.7,
  }));

  return [...staticPages, ...seoPages];
}