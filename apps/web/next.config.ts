import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  // This is needed to support CORS headers for the API
  async headers() {
    return [
      {
        source: "/api/text-analysis",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "false" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "POST" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date",
          },
        ],
      },
    ]
  },
}

export default nextConfig
