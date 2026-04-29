import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No proxy needed — /api/students is now a built-in Next.js API Route
  // Works on both localhost and Vercel automatically
};

export default nextConfig;
