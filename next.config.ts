import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["react-dom", "@libsql/client"],
};

export default nextConfig;
