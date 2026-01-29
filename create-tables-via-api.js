const SUPABASE_PROJECT_ID = 'ekbjjkcuqqskraubogzl';
const ACCESS_TOKEN = 'sbp_033885b9cf13c49c6d3ad44ed0e06148004b34f5';

async function createTables() {
  console.log('正在通过 Supabase Management API 创建表...\n');
  
  const managementUrl = `https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/database/query`;
  
  const sql = `
    CREATE TABLE IF NOT EXISTS daily_market_stats (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stat_date DATE UNIQUE NOT NULL,
      limit_up_count INT NOT NULL DEFAULT 0,
      limit_down_count INT NOT NULL DEFAULT 0,
      total_volume BIGINT NOT NULL DEFAULT 0,
      total_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,
      max_continuous_limit INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS topic_rankings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      stat_date DATE NOT NULL,
      topic_code VARCHAR(20) NOT NULL,
      topic_name VARCHAR(100) NOT NULL,
      change_percent DECIMAL(10, 2) NOT NULL,
      close_price DECIMAL(10, 2),
      rank INT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(stat_date, topic_code)
    );

    CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_market_stats(stat_date DESC);
    CREATE INDEX IF NOT EXISTS idx_topic_date ON topic_rankings(stat_date DESC);
    CREATE INDEX IF NOT EXISTS idx_topic_rank ON topic_rankings(stat_date DESC, rank ASC);
  `;

  try {
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
      console.log('✅ 表创建成功！');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error('❌ 失败:', response.status, response.statusText);
      console.error(JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.error('❌ 错误:', e.message);
  }
}

createTables();
