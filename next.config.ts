import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 純前端靜態輸出（家庭財務戰情室）— 部署到 Vercel 靜態託管，連線到 Supabase
  output: "export",
  // 注意：不要設 assetPrefix: "./"，相對路徑會讓 /expenses/ 子頁載入 chunks 變成 404
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
