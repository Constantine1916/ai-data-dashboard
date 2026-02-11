import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@ai-data-dashboard/shared'
import { verifyToken, extractTokenFromRequest, generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth/cookies'
import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
import type { User } from '@/types/database'

/**
 * 刷新 Token API
 * 当 token 即将过期时，生成新的 token 并更新 cookie
 */
export const POST = createRouteHandler({
  POST: async (request, _context) => {
    try {
      // 从请求中提取当前 token
      const token = extractTokenFromRequest(request)

      if (!token) {
        return NextResponse.json(
          createErrorResponse(ERROR_CODES.UNAUTHORIZED, '未提供认证 Token'),
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      }

      // 验证当前 token（即使即将过期，只要还没过期就可以刷新）
      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          createErrorResponse(ERROR_CODES.UNAUTHORIZED, 'Token 无效或已过期'),
          { status: HTTP_STATUS.UNAUTHORIZED }
        )
      }

      // 从数据库获取用户信息
      const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY
      let users: User[] = []

      if (useSupabase) {
        // 使用 Supabase REST API
        const { data, error } = await supabase
          .from('users')
          .select('id, email, name, role, email_verified, created_at, updated_at')
          .eq('id', payload.id)
          .limit(1)

        if (error) {
          console.error('Supabase 查询错误:', error)
          return NextResponse.json(
            createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '数据库查询失败'),
            { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
          )
        }

        users = (data || []) as User[]
      } else {
        // 使用直接 PostgreSQL 连接（如果可用）
        users = await query<User>(
          'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
          [payload.id]
        )
      }

      if (users.length === 0) {
        return NextResponse.json(
          createErrorResponse(ERROR_CODES.NOT_FOUND, '用户不存在'),
          { status: HTTP_STATUS.NOT_FOUND }
        )
      }

      const user = users[0]

      // 生成新的 token
      const newToken = generateToken(user)

      // 创建响应
      const response = NextResponse.json(
        createSuccessResponse({
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            email_verified: user.email_verified || false,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          token: newToken,
          refreshed: true,
        })
      )

      // 更新 Cookie 中的 Token
      setAuthCookie(response, newToken)

      return response
    } catch (error) {
      console.error('刷新 Token 错误:', error)
      return NextResponse.json(
        createErrorResponse(ERROR_CODES.INTERNAL_ERROR, '刷新 Token 失败'),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }
  },
})
