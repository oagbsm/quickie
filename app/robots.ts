import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/business/dashboard",
        "/business/properties",
        "/business/bookings",
        "/business/turnovers",
        "/business/cleaners",
        "/business/issues",
        "/business/activity",
        "/business/settings",
        "/cleaner/",
        "/invite/",
        "/business/account",
        "/business/onboarding",
        "/business/continue",
        "/business/setup-error",
        "/book",
        "/check-price",
        "/results",
        "/complete",
        "/tasks-sent",
        "/screen2",
        "/screen3",
        "/p/",
        "/c/",
        "/qk-ops-7f3a",
        "/qk-ops-7f3a-login",
        "/SEOMAYBELATER",
      ],
    },
    sitemap: "https://www.quickola.co.uk/sitemap.xml",
    host: "https://www.quickola.co.uk",
  };
}
