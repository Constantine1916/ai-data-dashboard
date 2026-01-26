import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { parseJsonBody } from '@/lib/api/middleware'
import { hashPassword, generateToken } from '@/lib/auth'
import { setAuthCookie } from '@/lib/auth/cookies'
import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
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

      // 尝试使用 Supabase 客户端（如果配置了 service_role key）
      const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY

      let existingUsers: User[] = []
      let result: User[] = []

      if (useSupabase) {
        // 使用 Supabase REST API
        const { data: existingData, error: existingError } = await supabase
          .from('users')
          .select('id')
          .eq('email', validated.email)
          .limit(1)

        if (existingError) {
          console.error('Supabase 查询错误:', existingError)
          throw existingError
        }

        existingUsers = (existingData || []) as User[]

        if (existingUsers.length > 0) {
          return Response.json(
            createErrorResponse('EMAIL_EXISTS', '该邮箱已被注册'),
            { status: 400 }
          )
        }

        // 加密密码
        const passwordHash = await hashPassword(validated.password)

        // 创建用户
        const { data: insertData, error: insertError } = await supabase
          .from('users')
          .insert({
            email: validated.email,
            password_hash: passwordHash,
            name: validated.name,
            role: 'user',
          })
          .select('id, email, name, role, email_verified, created_at, updated_at')
          .single()

        if (insertError) {
          console.error('Supabase 插入错误:', insertError)
          throw insertError
        }

        result = insertData ? [insertData as User] : []
      } else {
        // 使用直接 PostgreSQL 连接（如果可用）
        // 检查邮箱是否已存在
        existingUsers = await query<User>(
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
        result = await query<User>(
          `INSERT INTO users (email, password_hash, name, role) 
           VALUES ($1, $2, $3, 'user') 
           RETURNING id, email, name, role, email_verified, created_at, updated_at`,
          [validated.email, passwordHash, validated.name]
        )
      }

      if (result.length === 0) {
        return Response.json(
          createErrorResponse('REGISTER_FAILED', '注册失败'),
          { status: 500 }
        )
      }

      const user = result[0]

      // 生成 Token
      const token = generateToken(user)

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
          // 仍然在响应体中返回 token（向后兼容，前端可以选择使用）
          token,
        }),
        { status: 201 }
      )

      // 将 Token 存储到 Cookie（30 天过期）
      setAuthCookie(response, token)

      return response
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
