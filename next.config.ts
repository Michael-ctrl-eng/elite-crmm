import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost',
    '.replit.dev',
    '.repl.co',
    '.replit.com',
  ],
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
