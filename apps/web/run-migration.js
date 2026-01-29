const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://postgres:%2Fhzn-%23pkKgL3evQ@db.ekbjjkcuqqskraubogzl.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync('lib/db/migrations/003_create_market_stats.sql', 'utf8');

pool.query(sql).then(() => {
  console.log('✅ 数据库迁移成功');
  pool.end();
}).catch(e => {
  console.error('❌ 迁移失败:', e.message);
  pool.end();
  process.exit(1);
});
