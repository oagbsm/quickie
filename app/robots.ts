import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/matching", "/results", "/complete", "/tasks-sent", "/p/", "/c/", "/qk-ops-7f3a", "/qk-ops-7f3a-login", "/SEOMAYBELATER"],
    },
    sitemap: "https://quickola.co.uk/sitemap.xml",
  };
}
