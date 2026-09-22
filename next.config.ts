import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["react-dom", "@libsql/client", "@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/pdf/**/*": ["./node_modules/@sparticuz/chromium/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    proxyClientMaxBodySize: "50mb",
  },
};

export default nextConfig;
