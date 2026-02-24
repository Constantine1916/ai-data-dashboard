/**
 * A股交易日判断工具
 */

import { supabase } from '@/lib/db/supabase'

/**
 * 判断是否为A股交易日期
 * 1. 先判断是否为周末
 * 2. 再尝试调用东方财富API确认
 */
export async function isTradingDay(date?: string): Promise<boolean> {
  // 获取目标日期（使用北京时间）
  const now = new Date()
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000)
  const targetDate = date || beijingTime.toISOString().split('T')[0]
  
  // 先简单判断是否为周末
  const day = beijingTime.getDay()
  if (day === 0 || day === 6) {
    console.log(`[交易日判断] ${targetDate} 是周末，不是交易日`)
    return false
  }
  
  console.log(`[交易日判断] ${targetDate} 是工作日，检查是否为交易日...`)
  
  try {
    // 使用东方财富的大盘行情API
    const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f2,f3,f6`
    
    const res = await fetch(url)
    const data = await res.json()
    
    // 如果 data 是空对象 {} 或 diff 不存在，说明是非交易日
    const marketData = data?.data
    const hasData = marketData && Object.keys(marketData).length > 0
    
    if (!hasData) {
      console.log(`[交易日判断] 东方财富API无数据，可能是节假日`)
      return false
    }
    
    // 检查是否有有效数据（f2 是最新价）
    const price = marketData?.f2
    // 如果价格是 '-' 或不存在，说明非交易时段/非交易日
    if (price === '-' || price === undefined || price === null) {
      console.log(`[交易日判断] 大盘价格为空，可能是收盘后或节假日`)
      return false
    }
    
    console.log(`[交易日判断] 今天是交易日！大盘价格: ${price}`)
    return true
  } catch (error) {
    console.error('[交易日判断] 判断交易日失败:', error)
    // 出错时假设是交易日（让数据收集继续）
    // 实际采集时如果没数据会失败，不影响判断
    console.log(`[交易日判断] API调用失败，默认为交易日`)
    return true
  }
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
