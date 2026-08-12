import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/jobs/",
        "/post-job/",
      ],
    },
    sitemap: "https://www.quickola.co.uk/sitemap.xml",
    host: "https://www.quickola.co.uk",
  };
}
