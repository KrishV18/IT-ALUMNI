import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large responses (PDF can be 50-200MB for 179 students)
  experimental: {
    serverActions: {
      bodySizeLimit: "500mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
