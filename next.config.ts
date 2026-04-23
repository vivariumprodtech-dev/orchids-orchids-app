import type { NextConfig } from "next";

// Loader path from orchids-visual-edits - use direct resolve to get the actual file

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
} as NextConfig;

export default nextConfig;
// Orchids restart: 1772024104137
