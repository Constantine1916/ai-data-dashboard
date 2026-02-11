import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { createSuccessResponse } from '@ai-data-dashboard/shared'
import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
import type { User } from '@/types/database'
import { type DbUser, mapDbUsersToUsers } from '@/lib/db/user-mapper'

export const GET = requireAuth(async (request, user) => {
  // 尝试使用 Supabase 客户端（如果配置了 service_role key）
  const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  let dbUsers: DbUser[] = []

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

    dbUsers = (data || []) as DbUser[]
  } else {
    // 使用直接 PostgreSQL 连接（如果可用）
    dbUsers = await query<DbUser>(
      'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
      [user.id]
    )
  }

  // 转换数据库字段到 TypeScript 类型
  const users = mapDbUsersToUsers(dbUsers)

  if (users.length === 0) {
    return NextResponse.json(
      createSuccessResponse(null),
      { status: 404 }
    )
  }

  const dbUser = users[0]

  // 使用 NextResponse 以便可以设置 cookie（如果 token 需要刷新）
  return NextResponse.json(
    createSuccessResponse({
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      email_verified: dbUser.email_verified || false,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
    })
  )
})
