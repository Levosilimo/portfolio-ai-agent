import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "assets.aceternity.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      { protocol: "https", hostname: "github.com" },
      { protocol: "https", hostname: "imgur.com" },
      { protocol: "https", hostname: "i.imgur.com" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
  reactCompiler: true,
  rewrites: async () => {
    return {
      beforeFiles: [
        { source: "/llms.txt", destination: "/md" },
        { source: "/llm.txt", destination: "/md" },
        { source: "/llm.md", destination: "/md" },
        {
          source: "/",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*)text/markdown(.*)",
            },
          ],
          destination: "/md",
        },
        {
          source: "/sitemap",
          has: [
            {
              type: "header",
              key: "accept",
              value: "(.*)text/markdown(.*)",
            },
          ],
          destination: "/sitemap.md",
        },
      ],
    };
  },
};

export default nextConfig;
