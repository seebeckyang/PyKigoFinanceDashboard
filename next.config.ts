import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 純前端靜態輸出（Demo Mode）— 可直接部署到 S3 / pplx.app，無需常駐 server
  output: "export",
  assetPrefix: "./",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
