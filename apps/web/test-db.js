const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:***REMOVED***@db.ekbjjkcuqqskraubogzl.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT 1 as test').then(r => {
  console.log('✅ 连接成功:', r.rows);
  pool.end();
}).catch(e => {
  console.error('❌ 失败:', e.message);
  pool.end();
});
