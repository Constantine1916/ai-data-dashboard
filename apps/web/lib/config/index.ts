import { z } from 'zod'

// 环境变量 Schema
const envSchema = z.object({
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

// 验证并导出环境变量
function getEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  })

  if (!parsed.success) {
    console.error('❌ 环境变量验证失败:', parsed.error.flatten().fieldErrors)
    // 在开发环境中，允许部分环境变量缺失
    if (process.env.NODE_ENV === 'production') {
      throw new Error('环境变量配置错误')
    }
    // 开发环境返回默认值
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      NODE_ENV: 'development' as const,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }
  }

  return parsed.data
}

export const env = getEnv()

// 配置对象
export const config = {
  env: env.NODE_ENV,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  database: {
    url: env.DATABASE_URL || process.env.DATABASE_URL,
  },
  app: {
    url: env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
} as const
