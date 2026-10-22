import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Lets phones on the same Wi-Fi open the dev server (e.g. http://192.168.1.17:3233). Dev only.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  serverExternalPackages: ["mongoose", "sharp"],
  images: {
    // Uploaded media is served by app/media/[...path]/route.ts and optimised by next/image.
    localPatterns: [{ pathname: "/media/**", search: "" }, { pathname: "/brand/**", search: "" }],
    qualities: [70, 80],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  cacheLife: {
    // Content edited from the admin: kept until an admin save calls updateTag().
    content: { stale: 300, revalidate: 60 * 60 * 24, expire: 60 * 60 * 24 * 30 },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
