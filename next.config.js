/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
  },
  // Enable serverExternalPackages to support mongoose
  experimental: {
    serverExternalPackages: ['mongoose']
  },
  // Enable output tracing for Heroku
  output: 'standalone',
};

module.exports = nextConfig;
