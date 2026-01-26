import { NextResponse } from 'next/server'

// Cookie 配置
const COOKIE_NAME = 'auth-token'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 天（秒）
const COOKIE_PATH = '/'
const COOKIE_HTTP_ONLY = true
const COOKIE_SECURE = process.env.NODE_ENV === 'production' // 生产环境使用 HTTPS
const COOKIE_SAME_SITE = 'lax' as const

/**
 * 设置认证 Token Cookie
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    maxAge: COOKIE_MAX_AGE,
    path: COOKIE_PATH,
    httpOnly: COOKIE_HTTP_ONLY,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  })
}

/**
 * 清除认证 Token Cookie
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    maxAge: 0,
    path: COOKIE_PATH,
    httpOnly: COOKIE_HTTP_ONLY,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
  })
}

/**
 * 从请求中读取 Cookie 中的 Token
 */
export function getAuthCookieFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      acc[key] = decodeURIComponent(value)
    }
    return acc
  }, {} as Record<string, string>)

  return cookies[COOKIE_NAME] || null
}
