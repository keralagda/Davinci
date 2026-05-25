import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles deployment — no standalone needed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // Ensure Prisma works in serverless
  serverExternalPackages: ['@prisma/client', '@libsql/client'],
};

export default nextConfig;
