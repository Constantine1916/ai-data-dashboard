import { createClient } from '@supabase/supabase-js'
import { config } from '../config'
import type { User } from '@/types/database'

// 创建 Supabase 客户端（使用 service_role key 进行服务器端操作）
// 注意：service_role key 有完整权限，只能在服务器端使用
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 环境变量未设置')
}

if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY 未设置，将使用 anon key（功能受限）')
}

// 使用 service_role key 创建客户端（服务器端使用）
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * 使用 Supabase REST API 执行查询
 * 这是一个适配器，将 SQL 查询转换为 Supabase 客户端调用
 */
export async function querySupabase<T = unknown>(
  table: string,
  options?: {
    select?: string
    eq?: Record<string, unknown>
    insert?: Record<string, unknown>
    update?: Record<string, unknown>
    delete?: boolean
  }
): Promise<T[]> {
  try {
    let query = supabase.from(table).select(options?.select || '*')

    // 添加过滤条件
    if (options?.eq) {
      for (const [key, value] of Object.entries(options.eq)) {
        query = query.eq(key, value)
      }
    }

    // INSERT 操作
    if (options?.insert) {
      const { data, error } = await supabase.from(table).insert(options.insert).select()
      if (error) throw error
      return (data || []) as T[]
    }

    // UPDATE 操作
    if (options?.update) {
      if (!options.eq) {
        throw new Error('UPDATE 操作需要提供 eq 条件')
      }
      let updateQuery = supabase.from(table).update(options.update)
      for (const [key, value] of Object.entries(options.eq)) {
        updateQuery = updateQuery.eq(key, value)
      }
      const { data, error } = await updateQuery.select()
      if (error) throw error
      return (data || []) as T[]
    }

    // DELETE 操作
    if (options?.delete) {
      if (!options.eq) {
        throw new Error('DELETE 操作需要提供 eq 条件')
      }
      let deleteQuery = supabase.from(table).delete()
      for (const [key, value] of Object.entries(options.eq)) {
        deleteQuery = deleteQuery.eq(key, value)
      }
      const { data, error } = await deleteQuery.select()
      if (error) throw error
      return (data || []) as T[]
    }

    // SELECT 操作
    const { data, error } = await query
    if (error) throw error
    return (data || []) as T[]
  } catch (error) {
    console.error('Supabase 查询错误:', error)
    throw error
  }
}
