import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { parseJsonBody } from '@/lib/api/middleware'
import { hashPassword, generateToken } from '@/lib/auth'
import { query } from '@/lib/db'
import { z } from 'zod'
import type { User } from '@/types/database'

// 注册请求验证 Schema
const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少需要 6 个字符'),
  name: z.string().min(1, '姓名不能为空'),
})

export const POST = createRouteHandler({
  POST: async (request) => {
    try {
      // 解析和验证请求体
      const body = await parseJsonBody(request)
      const validated = registerSchema.parse(body)

      // 检查邮箱是否已存在
      const existingUsers = await query<User>(
        'SELECT id FROM users WHERE email = $1',
        [validated.email]
      )

      if (existingUsers.length > 0) {
        return Response.json(
          createErrorResponse('EMAIL_EXISTS', '该邮箱已被注册'),
          { status: 400 }
        )
      }

      // 加密密码
      const passwordHash = await hashPassword(validated.password)

      // 创建用户
      const result = await query<User>(
        `INSERT INTO users (email, password_hash, name, role) 
         VALUES ($1, $2, $3, 'user') 
         RETURNING id, email, name, role, email_verified, created_at, updated_at`,
        [validated.email, passwordHash, validated.name]
      )

      if (result.length === 0) {
        return Response.json(
          createErrorResponse('REGISTER_FAILED', '注册失败'),
          { status: 500 }
        )
      }

      const user = result[0]

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
        }),
        { status: 201 }
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
