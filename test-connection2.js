const { Pool } = require('pg');

// 正确的 Supabase pooler 格式
const pool = new Pool({
  host: 'aws-0-ap-south-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.ekbjjkcuqqskraubogzl',
  password: '/hzn-#pkKgL3evQ',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT 1 as test')
  .then(r => {
    console.log('✅ 连接成功!', r.rows);
    pool.end();
  })
  .catch(e => {
    console.log('❌ 失败:', e.message);
    pool.end();
  });
