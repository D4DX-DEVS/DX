import type { NextConfig } from "next";

// Images uploaded to R2 are linked straight from its public domain when one is configured.
const r2Public = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL) : null;

const nextConfig: NextConfig = {
  // Self-contained server in .next/standalone, which the Dockerfile ships to Cloudflare Containers.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Lets phones on the same Wi-Fi open the dev server (e.g. http://192.168.1.17:3233). Dev only.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  serverExternalPackages: ["sharp"],
  images: {
    // Uploaded media lives in R2: served from R2_PUBLIC_URL, or proxied by app/media/[...path]/route.ts.
    localPatterns: [{ pathname: "/media/**", search: "" }, { pathname: "/brand/**", search: "" }],
    remotePatterns: r2Public
      ? [{ protocol: r2Public.protocol === "http:" ? "http" : "https", hostname: r2Public.hostname, pathname: "/media/**", search: "" }]
      : [],
    qualities: [70, 80],
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    serverActions: { bodySizeLimit: "30mb" },
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
