import { Pool } from 'pg'
import { config } from '../config'

// 创建数据库连接池
// 注意：如果没有配置 DATABASE_URL，pool 将使用默认的本地连接
const pool = config.database.url
  ? new Pool({
      connectionString: config.database.url,
      // 连接池配置
      max: 20, // 最大连接数
      idleTimeoutMillis: 30000, // 空闲连接超时
      connectionTimeoutMillis: 2000, // 连接超时
    })
  : null

// 监听连接错误
if (pool) {
  pool.on('error', (err) => {
    console.error('数据库连接池错误:', err)
  })
}

/**
 * 检查数据库连接是否可用
 */
function ensurePool(): Pool {
  if (!pool) {
    throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  }
  return pool
}

/**
 * 执行查询
 */
export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const dbPool = ensurePool()
  const start = Date.now()
  try {
    const res = await dbPool.query(text, params)
    const duration = Date.now() - start
    if (config.isDevelopment) {
      console.log('执行查询', { text, duration, rows: res.rowCount })
    }
    return res.rows as T[]
  } catch (error) {
    console.error('查询错误', { text, error })
    // 提供更详细的错误信息
    if (error instanceof Error) {
      console.error('错误详情:', {
        message: error.message,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
      })
    }
    throw error
  }
}

/**
 * 执行事务
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const dbPool = ensurePool()
  const client = await dbPool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * 健康检查
 */
export async function healthCheck(): Promise<boolean> {
  if (!pool) {
    return false
  }
  try {
    const result = await pool.query('SELECT 1')
    return result.rows.length > 0
  } catch {
    return false
  }
}

export { pool }
