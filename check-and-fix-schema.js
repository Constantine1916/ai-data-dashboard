const SUPABASE_PROJECT_ID = 'ekbjjkcuqqskraubogzl';
const ACCESS_TOKEN = 'sbp_033885b9cf13c49c6d3ad44ed0e06148004b34f5';

async function fixSchema() {
  console.log('检查并修复表结构...\n');
  
  const managementUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;
  
  // 先删除旧表重建
  const sql = `
    DROP TABLE IF EXISTS daily_market_stats CASCADE;
    DROP TABLE IF EXISTS topic_rankings CASCADE;
    
    CREATE TABLE daily_market_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stat_date DATE UNIQUE NOT NULL,
      limit_up_count INTEGER NOT NULL DEFAULT 0,
      limit_down_count INTEGER NOT NULL DEFAULT 0,
      total_volume BIGINT NOT NULL DEFAULT 0,
      total_amount NUMERIC(20, 2) NOT NULL DEFAULT 0,
      max_continuous_limit INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE topic_rankings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stat_date DATE NOT NULL,
      topic_code VARCHAR(20) NOT NULL,
      topic_name VARCHAR(100) NOT NULL,
      change_percent NUMERIC(10, 2) NOT NULL,
      close_price NUMERIC(10, 2),
      rank INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(stat_date, topic_code)
    );

    CREATE INDEX idx_daily_stats_date ON daily_market_stats(stat_date DESC);
    CREATE INDEX idx_topic_date ON topic_rankings(stat_date DESC);
  `;

  const response = await fetch(managementUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const result = await response.json();
  
  if (response.ok) {
    console.log('✅ 表结构已修复！');
  } else {
    console.error('❌ 失败:', result);
  }
}

fixSchema();
