import { Pool } from 'pg'
import { config } from '../config'

// 解析 Supabase 连接字符串
function parseSupabaseUrl(urlString: string) {
  // 格式: postgresql://postgres.PROJECT_ID:PASSWORD@HOST:PORT/postgres
  const url = new URL(urlString);
  const username = url.username;
  const password = decodeURIComponent(url.password);
  const host = url.hostname;
  const port = parseInt(url.port);
  const database = url.pathname.slice(1); // 去掉开头的 /
  
  return { username, password, host, port, database };
}

// 创建数据库连接池
const pool = config.database.url
  ? (() => {
      try {
        // 如果是 Supabase URL，解析后用配置对象
        if (config.database.url.includes('supabase.com')) {
          const { username, password, host, port, database } = parseSupabaseUrl(config.database.url);
          return new Pool({
            user: username,
            password: password,
            host: host,
            port: port,
            database: database,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: { rejectUnauthorized: false },
          });
        } else {
          // 其他数据库用连接字符串
          return new Pool({
            connectionString: config.database.url,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: config.isDevelopment ? { rejectUnauthorized: false } : true,
          });
        }
      } catch (e) {
        console.error('数据库连接配置错误:', e);
        return null;
      }
    })()
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
