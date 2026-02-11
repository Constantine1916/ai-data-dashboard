import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  // 增加 API 路由的超时时间（Vercel Serverless）
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
