/**
 * A股交易日判断工具
 * 简化版：只判断周末，节假日需要手动排除或后续接入完整交易日历
 */

import { supabase } from '@/lib/db/supabase'

/**
 * 判断是否为A股交易日期
 * 只判断周末（周六周日不是交易日）
 * 工作日默认是交易日
 */
export async function isTradingDay(date?: string): Promise<boolean> {
  // 获取目标日期（使用北京时间）
  const now = new Date()
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const targetDate = date || beijingTime.toISOString().split('T')[0]
  
  // 判断是否为周末
  const day = beijingTime.getDay()
  if (day === 0 || day === 6) {
    console.log(`[交易日判断] ${targetDate} 是周末，不是交易日`)
    return false
  }
  
  console.log(`[交易日判断] ${targetDate} 是工作日，默认是交易日`)
  return true
}

/**
 * 获取最近的交易日期
 * 如果今天是交易日，返回今天；否则返回最后一个交易日
 */
export async function getLatestTradingDay(): Promise<string> {
  // 先获取数据库中最后一个有数据的日期
  const { data, error } = await supabase
    .from('daily_market_stats')
    .select('stat_date')
    .order('stat_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!error && data?.stat_date) {
    return data.stat_date
  }

  // 如果数据库没有数据，返回一个默认的近期交易日
  return new Date(new Date().getTime() + 8 * 60 * 60 * 1000 - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}

/**
 * 获取本周期的交易日期
 * 用于显示：如果是交易日显示今天，否则显示最后一个交易日
 */
export async function getCurrentTradingDate(): Promise<string> {
  const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  if (await isTradingDay(today)) {
    return today
  }
  
  // 如果今天不是交易日，返回最后一个交易日
  return getLatestTradingDay()
}
