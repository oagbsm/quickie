import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/matching", "/results","/qk-ops-7f3a","/qk-ops-7f3a-login"],
    },
    sitemap: "https://www.quickola.co.uk/sitemap.xml",
  };
}