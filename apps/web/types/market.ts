import type { BaseEntity } from '@/lib/shared'

/**
 * 每日市场统计数据
 */
export interface DailyMarketStats extends BaseEntity {
  statDate: string // 统计日期 YYYY-MM-DD
  limitUpCount: number // 涨停数量
  limitDownCount: number // 跌停数量
  totalVolume: number // 市场总成交量（手）
  totalAmount: number // 市场总成交额（元）
  maxContinuousLimit: number // 最高连板天数
}

/**
 * 题材涨幅数据
 */
export interface TopicRanking extends BaseEntity {
  statDate: string // 统计日期
  topicCode: string // 题材代码
  topicName: string // 题材名称
  changePercent: number // 涨跌幅（%）
  closePrice?: number // 收盘价
  rank?: number // 排名
}

/**
 * 东方财富API - 股票数据
 */
export interface EastMoneyStock {
  f12: string // 股票代码
  f14: string // 股票名称
  f2: number // 最新价
  f3: number // 涨跌幅
  f4: number // 涨跌额
  f5: number // 成交量（手）
  f6: number // 成交额
  f15?: number // 最高价
  f16?: number // 最低价
  f17?: number // 今开
  f18?: number // 昨收
  f62?: number // 连板天数
}

/**
 * 东方财富API - 板块数据
 */
export interface EastMoneyTopic {
  f12: string // 板块代码
  f14: string // 板块名称
  f2: number // 最新价
  f3: number // 涨跌幅
}

/**
 * 东方财富API响应
 */
export interface EastMoneyResponse<T> {
  rc: number
  rt: number
  svr: number
  lt: number
  full: number
  data: {
    total: number
    diff: T[]
  } | null
}
