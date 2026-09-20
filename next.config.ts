import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["react-dom", "@libsql/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
