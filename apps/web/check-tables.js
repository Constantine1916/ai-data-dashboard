const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:hzn-%23pkKgL3evQ@db.ekbjjkcuqqskraubogzl.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

pool.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('daily_market_stats', 'topic_rankings')
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
