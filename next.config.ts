import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['image.tmdb.org', 'via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/t/p/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  serverExternalPackages: ['neo4j-driver'],
};

export default nextConfig;
