import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 改用 Vercel server mode，支援 API routes（CRUD / cron / init-schema 都要）
  // service_role key 只在 server side 用，前端 bundle 不會看到
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
