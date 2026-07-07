/**
 * A股市场数据采集 - 使用东方财富API
 * 
 * 功能：
 * 1. 采集涨跌停数据
 * 2. 采集市场总成交额（沪深两市）
 * 3. 采集题材强度排行
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface LimitUpStock {
  code: string
  name: string
  percent: number
  price: number
  limitDays: number
  industry?: string
}

interface LimitDownStock {
  code: string
  name: string
  percent: number
  price: number
  limitDays: number
  industry?: string
}

interface ConceptData {
  code: string
  name: string
  closePrice: number
  percent: number
  upCount: number
  downCount: number
  amount: number
}

interface DailyStats {
  date: string
  limitUpCount: number
  limitDownCount: number
  totalVolume: number
  totalAmount: number
  maxContinuousLimit: number
}

interface MarketTotals {
  totalVolume: number
  totalAmount: number
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json,text/plain,*/*',
      'Referer': 'https://quote.eastmoney.com/',
    },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }

  return await res.json()
}

async function fetchJsonWithRetry(url: string, label: string, maxRetries = 3) {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchJson(url)
    } catch (e) {
      lastError = e
      console.log(`${label} 第${attempt}次请求失败: ${e}`)
      if (attempt < maxRetries) {
        await sleep(attempt * 1000)
      }
    }
  }

  throw lastError
}

function parseTencentMarketTotals(text: string): MarketTotals {
  let totalVolume = 0
  let totalAmount = 0

  for (const row of text.split(';').map(item => item.trim()).filter(Boolean)) {
    const payload = row.split('=')[1]?.replace(/^"|"$/g, '')
    if (!payload) continue

    const combined = payload
      .split('~')
      .find(part => /^\d+(\.\d+)?\/\d+\/\d+(\.\d+)?$/.test(part))

    if (!combined) continue

    const [, volume, amount] = combined.split('/')
    totalVolume += Number(volume)
    totalAmount += Number(amount)
  }

  if (totalVolume <= 0 || totalAmount <= 0) {
    throw new Error(`腾讯成交额数据无效: volume=${totalVolume}, amount=${totalAmount}`)
  }

  return { totalVolume, totalAmount }
}

async function fetchTencentMarketTotals(): Promise<MarketTotals> {
  const res = await fetch('https://qt.gtimg.cn/q=sh000001,sz399001', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': '*/*',
      'Referer': 'https://quote.eastmoney.com/',
    },
  })

  if (!res.ok) {
    throw new Error(`腾讯指数接口 HTTP ${res.status}`)
  }

  return parseTencentMarketTotals(await res.text())
}

// 获取涨停股票
async function fetchLimitUp(date: string): Promise<LimitUpStock[]> {
  const params = new URLSearchParams({
    ut: '7eea3edcaed734bea9cbfc24409ed989',
    dpt: 'wz.ztzt',
    Pageindex: '0',
    pagesize: '10000',
    sort: 'fbt:asc',
    date,
  })
  const url = `https://push2ex.eastmoney.com/getTopicZTPool?${params}`
  
  try {
    const data = await fetchJsonWithRetry(url, '涨停池')
    
    if (data.data?.pool) {
      return data.data.pool.map((s: any) => ({
        code: s.c,
        name: s.n,
        percent: s.zdp,
        price: (s.p || 0) / 1000,
        limitDays: s.lbc || 0,
        industry: s.hybk,
      }))
    }
    return []
  } catch (e) {
    console.log(`涨停API错误: ${e}`)
    return []
  }
}

// 获取跌停股票
async function fetchLimitDown(date: string): Promise<LimitDownStock[]> {
  const params = new URLSearchParams({
    ut: '7eea3edcaed734bea9cbfc24409ed989',
    dpt: 'wz.ztzt',
    Pageindex: '0',
    pagesize: '10000',
    sort: 'fund:asc',
    date,
  })
  const url = `https://push2ex.eastmoney.com/getTopicDTPool?${params}`
  
  try {
    const data = await fetchJsonWithRetry(url, '跌停池')
    
    if (data.data?.pool) {
      return data.data.pool.map((s: any) => ({
        code: s.c,
        name: s.n,
        percent: s.zdp,
        price: (s.p || 0) / 1000,
        limitDays: s.days || 0,
        industry: s.hybk,
      }))
    }
    return []
  } catch (e) {
    console.log(`跌停API错误: ${e}`)
    return []
  }
}

// 获取沪深两市总成交额和成交量
async function fetchMarketTotals(): Promise<MarketTotals> {
  try {
    const fields = 'f43,f47,f48,f57,f58'
    const [shRes, szRes] = await Promise.all([
      fetchJsonWithRetry(`https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=${fields}`, '上证成交'),
      fetchJsonWithRetry(`https://push2.eastmoney.com/api/qt/stock/get?secid=0.399001&fields=${fields}`, '深证成交')
    ])
    
    const shAmount = Number(shRes.data?.f48 || 0)
    const szAmount = Number(szRes.data?.f48 || 0)
    const shVolume = Number(shRes.data?.f47 || 0)
    const szVolume = Number(szRes.data?.f47 || 0)
    const totalVolume = shVolume + szVolume
    const totalAmount = shAmount + szAmount

    if (totalVolume <= 0 || totalAmount <= 0) {
      throw new Error(`东方财富成交额数据无效: volume=${totalVolume}, amount=${totalAmount}`)
    }

    return {
      totalVolume,
      totalAmount,
    }
  } catch (e) {
    console.log(`东方财富成交额失败，切换腾讯指数接口: ${e}`)
    return await fetchTencentMarketTotals()
  }
}

// 获取题材板块排行
async function fetchConceptRank(): Promise<ConceptData[]> {
  const url = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=100&po=1&np=1&ut=bd1d9ddb04089700cf9c27f6f7426281&fltt=2&invt=2&fid=f3&fs=m:90+t:3&fields=f12,f14,f2,f3,f5,f6'
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.data?.diff) {
      return data.data.diff.map((s: any) => ({
        code: s.f12,
        name: s.f14,
        closePrice: s.f2,
        percent: s.f3,
        upCount: 0,
        downCount: 0,
        amount: s.f6 || 0
      }))
    }
    return []
  } catch (e) {
    console.log(`题材API错误: ${e}`)
    return []
  }
}

// 保存每日统计数据
async function saveDailyStats(stats: DailyStats) {
  const { error } = await supabase
    .from('daily_market_stats')
    .upsert({
      stat_date: stats.date,
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

// 保存涨停股票
async function saveLimitUpStocks(date: string, stocks: LimitUpStock[]) {
  const { error } = await supabase
    .from('limit_up_stocks')
    .upsert({
      stat_date: date,
      stocks: stocks,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stat_date' })
    .select()
    .single()
  
  if (error) throw error
}

// 保存跌停股票
async function saveLimitDownStocks(date: string, stocks: LimitDownStock[]) {
  const { error } = await supabase
    .from('limit_down_stocks')
    .upsert({
      stat_date: date,
      stocks: stocks,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stat_date' })
    .select()
    .single()
  
  if (error) throw error
}

// 保存题材数据
async function saveConcepts(date: string, concepts: ConceptData[]) {
  const { error: conceptError } = await supabase
    .from('concept_rankings')
    .upsert({
      stat_date: date,
      concepts: concepts,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stat_date' })
    .select()
    .single()
  
  if (conceptError) throw conceptError

  if (concepts.length === 0) return

  await supabase.from('topic_rankings').delete().eq('stat_date', date)

  const topicRows = concepts.map((concept, index) => ({
    stat_date: date,
    topic_code: concept.code,
    topic_name: concept.name,
    change_percent: concept.percent,
    close_price: concept.closePrice,
    rank: index + 1,
  }))

  const { error: topicError } = await supabase
    .from('topic_rankings')
    .insert(topicRows)

  if (topicError) throw topicError
}

/**
 * 判断是否为A股交易日期
 */
async function isTradingDay(dateStr: string): Promise<boolean> {
  const date = new Date(`${dateStr}T00:00:00+08:00`)
  const day = date.getDay()
  if (day === 0 || day === 6) {
    return false
  }

  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f43,f57,f58`
  
  try {
    const data = await fetchJsonWithRetry(url, '交易日判断')
    
    // 工作日不因为行情接口短暂异常而跳过；后续成交额校验会阻止写入坏数据。
    const marketData = data?.data
    if (!marketData || Object.keys(marketData).length === 0) {
      console.log(`交易日判断接口未返回行情，按工作日继续采集: ${dateStr}`)
      return true
    }
    
    const price = marketData?.f43
    if (price === '-' || price === undefined || price === null) {
      console.log(`交易日判断接口价格无效，按工作日继续采集: ${dateStr}`)
    }
    return true
  } catch (e) {
    console.log(`判断交易日失败: ${e}`)
    return true
  }
}

serve(async (req: Request) => {
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  })
  
  if (req.method === 'OPTIONS') return new Response('ok', { headers })
  if (req.method !== 'POST') return new Response(JSON.stringify({error:'Method not allowed'}), {status:405,headers})
  
  try {
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '1')
    const today = new Date().toISOString().split('T')[0]
    const todayFormatted = today.replace(/-/g, '')
    
    // 检查今天是否为交易日
    const todayIsTrading = await isTradingDay(today)
    if (!todayIsTrading) {
      console.log(`今日 ${today} 为非交易日，跳过采集`)
      return new Response(JSON.stringify({
        success: true,
        skipped: true,
        message: `今日 ${today} 为非交易日（节假日/周末），跳过数据采集`
      }), { headers })
    }
    
    console.log(`=== 开始采集近${days}日数据 ===`)
    
    // 采集今日数据
    const [limitUp, limitDown, concepts] = await Promise.all([
      fetchLimitUp(todayFormatted),
      fetchLimitDown(todayFormatted),
      fetchConceptRank()
    ])
    
    // 获取市场总成交额和成交量
    const marketTotals = await fetchMarketTotals()
    
    const maxLimit = limitUp.length > 0 
      ? Math.max(...limitUp.map((s: any) => s.limitDays || 0))
      : 0
    
    // 保存今日数据
    await saveDailyStats({
      date: today,
      limitUpCount: limitUp.length,
      limitDownCount: limitDown.length,
      totalVolume: marketTotals.totalVolume,
      totalAmount: marketTotals.totalAmount,
      maxContinuousLimit: maxLimit
    })
    
    await saveLimitUpStocks(today, limitUp)
    await saveLimitDownStocks(today, limitDown)
    await saveConcepts(today, concepts)
    
    console.log(`今日: 涨停${limitUp.length}只, 跌停${limitDown.length}只, 成交额${(marketTotals.totalAmount/1e8).toFixed(0)}亿`)
    
    // 采集历史数据
    const historyResults = []
    for (let i = 1; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateFormatted = dateStr.replace(/-/g, '')
      
      // 检查是否为交易日
      const isTrading = await isTradingDay(dateStr)
      if (!isTrading) {
        console.log(`跳过 ${dateStr}（非交易日）`)
        continue
      }
      
      console.log(`采集 ${dateStr}...`)
      
      try {
        const [zt, dt] = await Promise.all([
          fetchLimitUp(dateFormatted),
          fetchLimitDown(dateFormatted)
        ])
        
        const historyTotals = await fetchMarketTotals()
        const maxL = zt.length > 0 ? Math.max(...zt.map((s: any) => s.limitDays || 0)) : 0
        
        await saveDailyStats({
          date: dateStr,
          limitUpCount: zt.length,
          limitDownCount: dt.length,
          totalVolume: historyTotals.totalVolume,
          totalAmount: historyTotals.totalAmount,
          maxContinuousLimit: maxL
        })
        
        historyResults.push({
          date: dateStr,
          limitUp: zt.length,
          limitDown: dt.length,
          amount: historyTotals.totalAmount
        })
        
        console.log(`  ${dateStr}: 涨停${zt.length}只, 跌停${dt.length}只, 成交额${(historyTotals.totalAmount/1e8).toFixed(0)}亿`)
      } catch (e) {
        console.log(`${dateStr}采集失败: ${e}`)
      }
      
      await new Promise(r => setTimeout(r, 500))
    }
    
    console.log('=== 采集完成 ===')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        today: {
          date: today,
          limitUpCount: limitUp.length,
          limitDownCount: limitDown.length,
          totalVolume: marketTotals.totalVolume,
          totalAmount: marketTotals.totalAmount,
          maxContinuousLimit: maxLimit,
          limitUp: limitUp.slice(0, 30),
          limitDown: limitDown.slice(0, 30)
        },
        history: historyResults,
        concepts: concepts.slice(0, 20)
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
