import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const EASTMONEY_BASE_URL = 'https://push2.eastmoney.com/api/qt'

interface EastMoneyStock {
  f12: string  // 代码
  f14: string  // 名称
  f2: number   // 最新价
  f3: number   // 涨跌幅
  f5: number   // 成交量
  f6: number   // 成交额
  f62?: number // 连板天数
}

interface EastMoneyResponse<T> {
  rc: number
  data?: {
    total: number
    diff: T[]
  } | null
}

// 根据代码和名称判断涨停阈值
function getLimitThreshold(code: string, name: string): number {
  // ST股票涨停幅度是5%
  if (name.startsWith('ST') && !name.includes('*')) {
    return 4.9
  }
  // 北交所 30%
  if (code.startsWith('8')) {
    return 29.9
  }
  // 科创板/创业板 20%
  if (code.startsWith('68') || code.startsWith('300') || code.startsWith('301')) {
    return 19.9
  }
  // 主板 10%
  return 9.9
}

// 判断是否为ST股票
function isSTStock(name: string): boolean {
  return name.startsWith('ST') && !name.includes('*')
}

// 东方财富API请求
async function fetchEastMoney(params: string): Promise<EastMoneyStock[]> {
  const url = `${EASTMONEY_BASE_URL}/clist/get?${params}`
  console.log(`请求东方财富: ${url.substring(0, 100)}...`)
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) {
      console.log(`HTTP错误: ${res.status}`)
      return []
    }
    
    const data: EastMoneyResponse<EastMoneyStock> = await res.json()
    if (data.rc !== 0 || !data.data) {
      console.log(`API异常: rc=${data.rc}`)
      return []
    }
    
    console.log(`获取到 ${data.data.diff?.length || 0} 只股票`)
    return data.data.diff || []
  } catch (e: any) {
    console.log(`请求失败: ${e.message}`)
    return []
  }
}

// 获取涨停股票（正确判断各板块阈值）
async function getLimitUpStocks(): Promise<EastMoneyStock[]> {
  const params = new URLSearchParams({
    pn: '1',
    pz: '5000',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3,f5,f6,f62',
  })
  
  const allStocks = await fetchEastMoney(params.toString())
  
  return allStocks.filter(s => {
    const threshold = getLimitThreshold(s.f12, s.f14)
    return s.f3 >= threshold && !isSTStock(s.f14)
  })
}

// 获取跌停股票（正确判断各板块阈值）
async function getLimitDownStocks(): Promise<EastMoneyStock[]> {
  const params = new URLSearchParams({
    pn: '1',
    pz: '5000',
    po: '0',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3,f5,f6',
  })
  
  const allStocks = await fetchEastMoney(params.toString())
  
  return allStocks.filter(s => {
    const threshold = getLimitThreshold(s.f12, s.f14)
    return s.f3 <= -threshold && !isSTStock(s.f14)
  })
}

// 获取成交量和成交额
async function getMarketVolume(): Promise<{ volume: number; amount: number }> {
  const params = new URLSearchParams({
    pn: '1',
    pz: '5000',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f5,f6',
  })
  
  const allStocks = await fetchEastMoney(params.toString())
  
  const volume = allStocks.reduce((sum, s) => sum + (s.f5 || 0), 0)
  const amount = allStocks.reduce((sum, s) => sum + (s.f6 || 0), 0)
  
  return { volume, amount }
}

// 获取最高连板天数
async function getMaxContinuousLimit(): Promise<number> {
  const limitUp = await getLimitUpStocks()
  if (limitUp.length === 0) return 0
  
  const validLimits = limitUp
    .map(s => s.f62 || 0)
    .filter(v => v >= 0 && v <= 50)
  
  return validLimits.length > 0 ? Math.max(...validLimits) : 0
}

// 保存数据
async function saveStats(date: string, stats: any) {
  const { error } = await supabase
    .from('daily_market_stats')
    .upsert({
      stat_date: date,
      limit_up_count: stats.limitUpCount,
      limit_down_count: stats.limitDownCount,
      total_volume: String(stats.totalVolume),
      total_amount: String(stats.totalAmount),
      max_continuous_limit: stats.maxContinuousLimit,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stat_date' })
    .select()
    .single()
  
  if (error) throw error
}

serve(async (req: Request) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  })
  
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}), {status:405,headers})
  
  try {
    console.log('=== 开始收集全量数据（东方财富API）===')
    const today = new Date().toISOString().split('T')[0]
    
    // 并行获取所有数据
    const [limitUpStocks, limitDownStocks, marketVolume, maxLimit] = await Promise.all([
      getLimitUpStocks(),
      getLimitDownStocks(),
      getMarketVolume(),
      getMaxContinuousLimit(),
    ])
    
    const stats = {
      limitUpCount: limitUpStocks.length,
      limitDownCount: limitDownStocks.length,
      totalVolume: marketVolume.volume,
      totalAmount: marketVolume.amount,
      maxContinuousLimit: maxLimit,
    }
    
    // 保存到数据库
    await saveStats(today, stats)
    
    console.log(`=== 完成: 涨停${stats.limitUpCount}, 跌停${stats.limitDownCount} ===`)
    console.log(`成交量: ${(stats.totalVolume/1e8).toFixed(2)}亿手, 成交额: ${(stats.totalAmount/1e8).toFixed(2)}亿`)
    
    // 返回涨停股票详情
    const limitUpDetails = limitUpStocks.slice(0, 30).map(s => ({
      code: s.f12,
      name: s.f14,
      percent: s.f3,
      limitDays: s.f62 || 0
    }))
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        date: today,
        stats,
        topLimitUp: limitUpDetails
      }
    }), { headers })
  } catch (e: any) {
    console.log(`错误: ${e.message}`)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'SERVER_ERROR', message: e.message }
    }), { status: 500, headers })
  }
})
