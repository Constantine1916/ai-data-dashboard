import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromRequest, isTokenExpiringSoon, generateToken } from './index'
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@ai-data-dashboard/shared'
import { setAuthCookie } from './cookies'
import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
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
 * 如果 token 即将过期，会自动刷新 token
 */
export async function authenticate(
  request: NextRequest
): Promise<{
  user: { id: string; email: string; role: string } | null
  error: NextResponse | null
  shouldRefreshToken?: boolean
  newToken?: string
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
  const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  let users: User[] = []

  if (useSupabase) {
    // 使用 Supabase REST API（获取完整用户信息，用于生成新 token）
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, email_verified, created_at, updated_at')
      .eq('id', payload.id)
      .limit(1)

    if (error) {
      console.error('Supabase 查询错误:', error)
      return {
        user: null,
        error: NextResponse.json(
          createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '数据库查询失败'),
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
        ),
      }
    }

    // 将 Supabase 返回的数据转换为 User 类型
    users = (data || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      email_verified: u.email_verified,
      created_at: u.created_at,
      updated_at: u.updated_at,
      createdAt: u.created_at, // BaseEntity 需要的字段
      updatedAt: u.updated_at, // BaseEntity 需要的字段
    })) as User[]
  } else {
    // 使用直接 PostgreSQL 连接（如果可用）
    users = await query<User>(
      'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [payload.id]
    )
  }

  if (users.length === 0) {
    return {
      user: null,
      error: NextResponse.json(
        createErrorResponse(ERROR_CODES.NOT_FOUND, '用户不存在'),
        { status: HTTP_STATUS.NOT_FOUND }
      ),
    }
  }

  const user = users[0]

  // 检查 Token 是否即将过期（7 天内），如果是则自动刷新
  const needsRefresh = isTokenExpiringSoon(token)
  let newToken: string | undefined

  if (needsRefresh) {
    // 生成新的 token（只需要 id, email, role）
    newToken = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at || user.createdAt,
      updated_at: user.updated_at || user.updatedAt,
    } as User)
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    error: null,
    shouldRefreshToken: needsRefresh,
    newToken,
  }
}

/**
 * 要求认证的 API 路由包装器
 * 自动处理 token 刷新
 */
export function requireAuth(
  handler: (request: NextRequest, user: { id: string; email: string; role: string }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user, error, shouldRefreshToken, newToken } = await authenticate(request)

    if (error || !user) {
      return error || NextResponse.json(
        createErrorResponse(ERROR_CODES.UNAUTHORIZED, '需要登录'),
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // 执行原始处理器
    const response = await handler(request, user)

    // 如果 token 需要刷新，自动更新 cookie
    if (shouldRefreshToken && newToken) {
      setAuthCookie(response, newToken)
      // 在响应头中添加标记，告知前端 token 已刷新
      response.headers.set('X-Token-Refreshed', 'true')
    }

    return response
  }
}
