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
      expiresIn: JWT_EXPIRES_IN,
    }
  )
}

/**
 * 验证 JWT Token
 */
export function verifyToken(token: string): {
  id: string
  email: string
  role: string
} | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
      role: string
    }
  } catch (error) {
    return null
  }
}

/**
 * 从请求中提取 Token
 */
export function extractTokenFromRequest(
  request: Request
): string | null {
  // 从 Authorization header 中提取
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 从 Cookie 中提取（如果使用 Cookie）
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    return cookies['auth-token'] || null
  }

  return null
}
