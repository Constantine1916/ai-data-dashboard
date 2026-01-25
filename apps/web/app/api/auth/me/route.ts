import { requireAuth } from '@/lib/auth/middleware'
import { createSuccessResponse } from '@ai-data-dashboard/shared'
import { query } from '@/lib/db'
import type { User } from '@/types/database'

export const GET = requireAuth(async (request, user) => {
  // 从数据库获取最新用户信息
  const users = await query<User>(
    'SELECT id, email, name, role, email_verified, created_at, updated_at FROM users WHERE id = $1',
    [user.id]
  )

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
