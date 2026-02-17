/**
 * A股交易日判断工具
 */

import { supabase } from '@/lib/db/supabase'

/**
 * 判断是否为A股交易日期（使用东方财富交易日历API）
 */
export async function isTradingDay(date?: string): Promise<boolean> {
  const targetDate = date || new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  try {
    // 使用东方财富的交易日历API
    const todayStr = targetDate.replace(/-/g, '')
    const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&secids=1.000001&fields=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f13,f14,f15,f16,f17,f18,f19,f20,f21,f23,f24,f25,f28,f30,f31,f32,f33,f34,f35,f36,f37,f38,f39,f40,f41,f42,f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64,f65,f66,f67,f68,f69,f70,f71,f72,f73,f74,f75,f76,f77,f78,f79,f80,f81,f82,f83,f84,f85,f86,f87,f88,f89,f90,f91,f92,f93,f94,f95,f96,f97,f98,f99,f100,f101,f102,f103,f104,f105,f106,f107,f108,f109,f110,f111,f112,f113,f114,f115,f116,f117,f118,f119,f120,f121,f122,f123,f124,f125,f126,f127,f128,f129,f130,f131,f132,f133,f134,f135,f136,f137,f138,f139,f140,f141,f142,f143,f144,f145,f146,f147,f148,f149,f150,f151,f152,f153,f154,f155,f156,f157,f158,f159,f160,f161,f162,f163,f164,f165,f166,f167,f168,f169,f170,f171,f172,f173,f174,f175,f176,f177,f178,f179,f180,f181,f182,f183,f184,f185,f186,f187,f188,f189,f190,f191,f192,f193,f194,f195,f196,f197,f198,f199,f200`
    
    const res = await fetch(url)
    const data = await res.json()
    
    // 如果能获取到大盘数据，说明是交易日
    // 如果返回空或异常，可能是非交易日
    return data?.data?.diff?.length > 0
  } catch (error) {
    console.error('判断交易日失败:', error)
    // 出错时尝试查询数据库中的最后一个交易日
    return false
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
