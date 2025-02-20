import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_FIRM_SLUG: process.env.FIRM_SLUG,
    NEXT_PUBLIC_FIRM_API_KEY: process.env.FIRM_API_KEY,
    NEXT_PUBLIC_CLOCKWORK_PUBLIC_KEY: process.env.CLOCKWORK_PUBLIC_KEY,
    NEXT_PUBLIC_CLOCKWORK_SECRET_KEY: process.env.CLOCKWORK_SECRET_KEY,
  },
};

export default nextConfig;
