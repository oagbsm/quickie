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
        destination: "/product",
        permanent: true,
      })),
      { source: "/business", destination: "/product", permanent: true },
      { source: "/for-providers", destination: "/product", permanent: true },
      { source: "/how-it-works", destination: "/product", permanent: true },
      { source: "/service-area", destination: "/product", permanent: true },
      { source: "/solutions/:path*", destination: "/product", permanent: true },
      { source: "/about", destination: "/product", permanent: true },
      { source: "/trust-safety", destination: "/product", permanent: true },
      { source: "/business/enquire", destination: "/product", permanent: true },
      {
        source: "/business/bookings",
        destination: "/business/turnovers",
        permanent: true,
      },
      {
        source: "/business/bookings/:path*",
        destination: "/business/turnovers",
        permanent: true,
      },
      {
        source: "/business/schedule",
        destination: "/business/turnovers",
        permanent: true,
      },
      {
        source: "/business/billing",
        destination: "/business/settings",
        permanent: true,
      },
      {
        source: "/business/account",
        destination: "/business/settings",
        permanent: true,
      },
      {
        source: "/admin/bookings",
        destination: "/admin/turnovers",
        permanent: true,
      },
      {
        source: "/admin/bookings/:path*",
        destination: "/admin/turnovers",
        permanent: true,
      },
      {
        source: "/admin/providers",
        destination: "/admin/cleaners",
        permanent: true,
      },
      {
        source: "/admin/customers",
        destination: "/admin/accounts",
        permanent: true,
      },
      {
        source: "/admin/customers/:path*",
        destination: "/admin/accounts",
        permanent: true,
      },
      {
        source: "/admin/enquiries",
        destination: "/admin/accounts",
        permanent: true,
      },
      { source: "/qk-ops-7f3a", destination: "/admin", permanent: true },
      { source: "/qk-ops-7f3a/:path*", destination: "/admin", permanent: true },
      {
        source: "/qk-ops-7f3a-login",
        destination: "/admin/login",
        permanent: true,
      },
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
      {
        source: "/business/legal/terms",
        destination: "/terms",
        permanent: true,
      },
      {
        source: "/business/legal/cancellation",
        destination: "/terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
