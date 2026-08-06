-- Supabase Edge Function collect-stock-stats dependencies
CREATE TABLE IF NOT EXISTS limit_up_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL,
  stocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS limit_down_stocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL,
  stocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS concept_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date DATE UNIQUE NOT NULL,
  concepts JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_limit_up_stocks_date ON limit_up_stocks(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_limit_down_stocks_date ON limit_down_stocks(stat_date DESC);
CREATE INDEX IF NOT EXISTS idx_concept_rankings_date ON concept_rankings(stat_date DESC);

COMMENT ON TABLE limit_up_stocks IS '每日涨停股票明细';
COMMENT ON TABLE limit_down_stocks IS '每日跌停股票明细';
COMMENT ON TABLE concept_rankings IS '每日概念板块排行原始数据';
