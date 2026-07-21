import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "example.supabase.co";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/sign/**" }] },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
