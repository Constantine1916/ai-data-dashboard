/**
 * 数据库表类型定义
 * 这些类型应该与数据库 Schema 保持一致
 */

import type { BaseEntity } from '@ai-data-dashboard/shared'

export interface User extends BaseEntity {
  email: string
  name: string
  role: 'admin' | 'user'
}
