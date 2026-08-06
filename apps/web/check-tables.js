const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL 环境变量必须设置');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN (
    'users',
    'daily_market_stats',
    'topic_rankings',
    'limit_up_stocks',
    'limit_down_stocks',
    'concept_rankings'
  )
`).then(r => {
  console.log('已存在的表:', r.rows.map(row => row.table_name));
  if (r.rows.length === 0) {
    console.log('\n❌ 表不存在！需要执行迁移：');
    console.log('psql "$DATABASE_URL" -f lib/db/migrations/003_create_market_stats.sql');
  }
  pool.end();
}).catch(e => {
  console.error('查询失败:', e.message);
  pool.end();
});
