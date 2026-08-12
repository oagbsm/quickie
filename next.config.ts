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
    return [
      { source: "/provider", destination: "/jobs", permanent: true },
      { source: "/for-providers", destination: "/jobs", permanent: true },
      { source: "/business/sign-in", destination: "/sign-in", permanent: true },
      { source: "/business/create-account", destination: "/create-account", permanent: true },
      { source: "/business/sign-up", destination: "/create-account", permanent: true },
      { source: "/auth/portal/sign-in", destination: "/sign-in", permanent: true },
      { source: "/auth/portal", destination: "/portal", permanent: true },
      { source: "/results", destination: "/", permanent: true },
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
      { source: "/privacy", destination: "/privacy-policy", permanent: true },
    ];
  },
};

export default nextConfig;
