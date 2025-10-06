import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // evita que fallos de lint cancelen `next build`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
