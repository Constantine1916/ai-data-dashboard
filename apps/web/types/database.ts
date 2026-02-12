/**
 * 数据库表类型定义
 * 这些类型应该与数据库 Schema 保持一致
 */

import type { BaseEntity } from '@/lib/shared'

export interface User extends BaseEntity {
  email: string
  password_hash?: string  // 不返回给前端
  name: string
  role: 'admin' | 'user'
  email_verified?: boolean
}

// 用户注册/登录时的输入类型
export interface UserInput {
  email: string
  password: string
  name?: string
}

// 返回给前端的用户类型（不包含敏感信息）
export interface UserPublic {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  email_verified?: boolean
  createdAt: string
  updatedAt: string
}
