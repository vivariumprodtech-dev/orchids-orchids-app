import type { NextConfig } from "next";
import path from "node:path";

const isVercel = !!process.env.VERCEL;

// Loader path from orchids-visual-edits - use direct resolve to get the actual file
const loaderPath = !isVercel ? require.resolve('orchids-visual-edits/loader.js') : null;

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
  // Only set outputFileTracingRoot in Orchids dev environment, not on Vercel
  ...(!isVercel && { outputFileTracingRoot: path.resolve(__dirname, '../../') }),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Only apply Orchids visual edits loader in dev
  ...(!isVercel && loaderPath && {
    turbopack: {
      rules: {
        "*.{jsx,tsx}": {
          loaders: [loaderPath]
        }
      }
    }
  })
} as NextConfig;

export default nextConfig;
// Orchids restart: 1772024104137
