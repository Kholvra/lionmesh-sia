import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentUpgrade: "security",
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async redirects() {
    return [
      {
        source: "/siklus-produksi",
        destination: "/produksi",
        permanent: false,
      },
      {
        source: "/siklus-produksi/:path*",
        destination: "/produksi/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
