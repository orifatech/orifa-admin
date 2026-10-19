import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@orifa/backend", "@orifa/ui"],
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
