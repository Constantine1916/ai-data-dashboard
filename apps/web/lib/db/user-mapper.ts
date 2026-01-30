import type { User } from '@/types/database'

// 数据库返回的原始用户类型
export type DbUser = {
  id: string
  email: string
  password_hash?: string | null
  name: string | null
  role: string
  email_verified: boolean | null
  created_at: string
  updated_at: string
}

/**
 * 将数据库字段（snake_case）转换为 TypeScript 类型（camelCase）
 */
export function mapDbUserToUser(dbUser: DbUser): User {
  return {
    id: dbUser.id,
    email: dbUser.email,
    password_hash: dbUser.password_hash || undefined,
    name: dbUser.name || '',
    role: dbUser.role as 'admin' | 'user',
    email_verified: dbUser.email_verified || false,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  }
}

/**
 * 批量转换
 */
export function mapDbUsersToUsers(dbUsers: DbUser[]): User[] {
  return dbUsers.map(mapDbUserToUser)
}
