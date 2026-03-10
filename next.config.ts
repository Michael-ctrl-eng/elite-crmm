import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    'localhost',
    '.replit.dev',
    '.repl.co',
    '.replit.com',
    '.z.ai',
  ],
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
