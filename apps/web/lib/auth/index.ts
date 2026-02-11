import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import type { User } from '@/types/database'

// JWT 密钥（生产环境必须使用环境变量）
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET 环境变量在生产环境中是必需的')
}

/**
 * 密码加密
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * 生成 JWT Token
 */
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN as string,
    } as jwt.SignOptions
  )
}

/**
 * 验证 JWT Token
 * 返回 payload 或 null（如果 token 无效或已过期）
 */
export function verifyToken(token: string): {
  id: string
  email: string
  role: string
  exp?: number
  iat?: number
} | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      role: string
      exp?: number
      iat?: number
    }
    return payload
  } catch (error) {
    // Token 无效或已过期
    return null
  }
}

/**
 * 检查 Token 是否即将过期（在 7 天内过期）
 * 用于实现自动刷新机制
 */
export function isTokenExpiringSoon(token: string): boolean {
  const payload = verifyToken(token)
  if (!payload || !payload.exp) {
    return true
  }

  const expirationTime = payload.exp * 1000 // 转换为毫秒
  const now = Date.now()
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000

  // 如果 token 在 7 天内过期，返回 true
  return expirationTime - now < sevenDaysInMs
}

/**
 * 从请求中提取 Token
 * 优先从 Cookie 读取，其次从 Authorization header 读取
 */
export function extractTokenFromRequest(
  request: Request
): string | null {
  // 优先从 Cookie 中提取（推荐方式）
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      if (key && value) {
        acc[key] = decodeURIComponent(value)
      }
      return acc
    }, {} as Record<string, string>)
    if (cookies['auth-token']) {
      return cookies['auth-token']
    }
  }

  // 从 Authorization header 中提取（向后兼容）
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  return null
}
