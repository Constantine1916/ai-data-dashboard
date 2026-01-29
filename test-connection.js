const { Pool } = require('pg');

// 测试不同的连接方式
const configs = [
  {
    name: 'Pooler with URL encoded password',
    connectionString: 'postgresql://postgres.ekbjjkcuqqskraubogzl:%2Fhzn-%23pkKgL3evQ@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
  },
  {
    name: 'Direct connection',
    connectionString: 'postgresql://postgres:/hzn-#pkKgL3evQ@db.ekbjjkcuqqskraubogzl.supabase.co:5432/postgres'
  }
];

async function testConnection(config) {
  console.log(`\n测试: ${config.name}`);
  const pool = new Pool({
    ...config,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ 连接成功!', result.rows);
    await pool.end();
    return true;
  } catch (e) {
    console.log('❌ 失败:', e.message);
    await pool.end();
    return false;
  }
}

(async () => {
  for (const config of configs) {
    await testConnection(config);
  }
})();
