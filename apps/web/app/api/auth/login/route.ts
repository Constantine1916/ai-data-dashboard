import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { parseJsonBody } from '@/lib/api/middleware'
import { verifyPassword, generateToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { z } from 'zod'
import type { User } from '@/types/database'

// 登录请求验证 Schema
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
})

export const POST = createRouteHandler({
  POST: async (request) => {
    try {
      // 解析和验证请求体
      const body = await parseJsonBody(request)
      const validated = loginSchema.parse(body)

      // 查找用户
      const users = await query<User>(
        'SELECT id, email, password_hash, name, role, email_verified, created_at, updated_at FROM users WHERE email = $1',
        [validated.email]
      )

      if (users.length === 0) {
        return Response.json(
          createErrorResponse('INVALID_CREDENTIALS', '邮箱或密码错误'),
          { status: 401 }
        )
      }

      const user = users[0]

      // 验证密码
      if (!user.password_hash) {
        return Response.json(
          createErrorResponse('INVALID_CREDENTIALS', '邮箱或密码错误'),
          { status: 401 }
        )
      }

      const isValidPassword = await verifyPassword(
        validated.password,
        user.password_hash
      )

      if (!isValidPassword) {
        return Response.json(
          createErrorResponse('INVALID_CREDENTIALS', '邮箱或密码错误'),
          { status: 401 }
        )
      }

      // 生成 Token
      const token = generateToken(user)

      // 返回用户信息（不包含密码）
      return Response.json(
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
          token,
        })
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return Response.json(
          createErrorResponse(
            'VALIDATION_ERROR',
            error.errors[0].message,
            error.errors
          ),
          { status: 400 }
        )
      }
      throw error
    }
  },
})
