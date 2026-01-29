#!/usr/bin/env node
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

console.log('正在执行数据库迁移...\n');

const migrationFile = path.join(__dirname, 'apps/web/lib/db/migrations/003_create_market_stats.sql');
const sql = fs.readFileSync(migrationFile, 'utf8');

pool.query(sql)
  .then(() => {
    console.log('✅ 数据库迁移成功！');
    console.log('\n表已创建:');
    console.log('  - daily_market_stats');
    console.log('  - topic_rankings');
    console.log('\n现在可以执行:');
    console.log('  curl -X POST http://localhost:3000/api/stats/collect');
    pool.end();
  })
  .catch(e => {
    console.error('❌ 迁移失败:', e.message);
    console.error('\n错误详情:', e);
    pool.end();
    process.exit(1);
  });
