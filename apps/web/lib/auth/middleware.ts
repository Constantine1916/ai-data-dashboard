import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromRequest } from './index'
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@ai-data-dashboard/shared'
import { query } from '@/lib/db'
import type { User } from '@/types/database'

/**
 * 认证用户信息（扩展 Request）
 */
export interface AuthRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
  }
}

/**
 * 认证中间件
 * 验证 JWT Token 并获取用户信息
 */
export async function authenticate(
  request: NextRequest
): Promise<{
  user: { id: string; email: string; role: string } | null
  error: NextResponse | null
}> {
  const token = extractTokenFromRequest(request)

  if (!token) {
    return {
      user: null,
      error: NextResponse.json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, '未提供认证 Token'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      ),
    }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return {
      user: null,
      error: NextResponse.json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Token 无效或已过期'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      ),
    }
  }

  // 从数据库验证用户是否存在
  const users = await query<User>(
    'SELECT id, email, role FROM users WHERE id = $1',
    [payload.id]
  )

  if (users.length === 0) {
    return {
      user: null,
      error: NextResponse.json(
        createErrorResponse(ERROR_CODES.NOT_FOUND, '用户不存在'),
        { status: HTTP_STATUS.NOT_FOUND }
      ),
    }
  }

  return {
    user: {
      id: users[0].id,
      email: users[0].email,
      role: users[0].role,
    },
    error: null,
  }
}

/**
 * 要求认证的 API 路由包装器
 */
export function requireAuth(
  handler: (request: NextRequest, user: { id: string; email: string; role: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticate(request)

    if (error || !user) {
      return error || NextResponse.json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, '需要登录'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    return handler(request, user)
  }
}
