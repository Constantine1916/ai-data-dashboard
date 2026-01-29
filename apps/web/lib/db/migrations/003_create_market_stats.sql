-- 每日市场统计数据表
CREATE TABLE IF NOT EXISTS daily_market_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL,                -- 统计日期
  limit_up_count INT NOT NULL DEFAULT 0,         -- 涨停数量（非ST）
  limit_down_count INT NOT NULL DEFAULT 0,       -- 跌停数量（非ST）
  total_volume BIGINT NOT NULL DEFAULT 0,        -- 市场总成交量（手）
  total_amount DECIMAL(20, 2) NOT NULL DEFAULT 0,-- 市场总成交额（元）
  max_continuous_limit INT NOT NULL DEFAULT 0,   -- 最高连板天数
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 题材（概念板块）涨幅数据表
CREATE TABLE IF NOT EXISTS topic_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE NOT NULL,                       -- 统计日期
  topic_code VARCHAR(20) NOT NULL,               -- 题材代码
  topic_name VARCHAR(100) NOT NULL,              -- 题材名称
  change_percent DECIMAL(10, 2) NOT NULL,        -- 涨跌幅（%）
  close_price DECIMAL(10, 2),                    -- 收盘价
  rank INT,                                      -- 排名
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stat_date, topic_code)
);

-- 索引优化
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_market_stats(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_topic_date ON topic_rankings(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_topic_rank ON topic_rankings(stat_date DESC, rank ASC);

-- 添加注释
COMMENT ON TABLE daily_market_stats IS '每日A股市场统计数据';
COMMENT ON TABLE topic_rankings IS '题材（概念板块）涨幅排名';
COMMENT ON COLUMN daily_market_stats.limit_up_count IS '非ST股票涨停数量';
COMMENT ON COLUMN daily_market_stats.limit_down_count IS '非ST股票跌停数量';
COMMENT ON COLUMN daily_market_stats.max_continuous_limit IS '当日最高连板天数';
