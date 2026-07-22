import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "example.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname,
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async redirects() {
    const retired = [
      "/book",
      "/check-price",
      "/results",
      "/complete",
      "/tasks-sent",
      "/screen2",
      "/screen3",
      "/home-tasks",
      "/cleaners-slough",
      "/regular-cleaner-slough",
      "/deep-cleaning-slough",
      "/end-of-tenancy-cleaning-slough",
      "/airbnb-cleaning-slough",
      "/after-builders-cleaning-slough",
      "/commercial-cleaning",
      "/business-success",
      "/quickola-price-index",
      "/quickola-vs-checkatrade-bark-taskrabbit",
      "/pricing-methodology",
      "/slough/:area/cleaner",
    ];
    return [
      ...retired.map((source) => ({
        source,
        destination: "/business/enquire",
        permanent: true,
      })),
      { source: "/business", destination: "/", permanent: true },
      { source: "/for-providers", destination: "/", permanent: false },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      {
        source: "/terms",
        destination: "/business/legal/terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
