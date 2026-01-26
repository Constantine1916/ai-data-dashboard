import { requireAuth } from '@/lib/auth/middleware'
import { createSuccessResponse } from '@ai-data-dashboard/shared'
import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
import type { User } from '@/types/database'

export const GET = requireAuth(async (request, user) => {
  // 尝试使用 Supabase 客户端（如果配置了 service_role key）
  const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  let users: User[] = []

  if (useSupabase) {
    // 使用 Supabase REST API
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, email_verified, created_at, updated_at')
      .eq('id', user.id)
      .limit(1)

    if (error) {
      console.error('Supabase 查询错误:', error)
      throw error
    }

    users = (data || []) as User[]
  } else {
    // 使用直接 PostgreSQL 连接（如果可用）
    users = await query<User>(
      'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [user.id]
    )
  }

  if (users.length === 0) {
    return Response.json(
      createSuccessResponse(null),
      { status: 404 }
    )
  }

  const dbUser = users[0]

  return Response.json(
    createSuccessResponse({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      email_verified: dbUser.email_verified || false,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    })
  )
})
