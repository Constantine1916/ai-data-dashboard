/**
 * A股市场数据采集 - 使用AKShare + 东方财富
 * 
 * 功能：
 * 1. 采集近7日涨跌停数据
 * 2. 采集涨停股票成交额
 * 3. 采集题材强度排行
 * 4. 采集连板股票
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
  amount: number
  industry?: string
}

interface LimitDownStock {
  code: string
  name: string
  percent: number
  price: number
  limitDays: number
  amount: number
  industry?: string
}

interface ConceptData {
  name: string
  percent: number
  upCount: number
  downCount: number
  amount: number
}

interface DailyStats {
  date: string
  limitUpCount: number
  limitDownCount: number
  totalAmount: number
  maxContinuousLimit: number
}

// 获取涨停股票（东方财富API）
async function fetchLimitUp(date: string): Promise<{ stocks: LimitUpStock[], totalAmount: number }> {
  const url = `https://push2.eastmoney.com/api/qt/stock/ztlist/get?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f62,f8,f6`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.data?.diff) {
      const stocks = data.data.diff.map((s: any) => ({
        code: s.f12,
        name: s.f14,
        percent: s.f3,
        price: s.f2,
        limitDays: s.f62 || 0,
        amount: s.f6 || 0
      }))
      const totalAmount = stocks.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
      return { stocks, totalAmount }
    }
    return { stocks: [], totalAmount: 0 }
  } catch (e) {
    console.log(`涨停API错误: ${e}`)
    return { stocks: [], totalAmount: 0 }
  }
}

// 获取跌停股票（东方财富API）
async function fetchLimitDown(date: string): Promise<{ stocks: LimitDownStock[], totalAmount: number }> {
  const url = `https://push2.eastmoney.com/api/qt/stock/ztlist/get?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f62,f8,f6`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.data?.diff) {
      const stocks = data.data.diff
        .filter((s: any) => s.f3 <= -9.9)
        .map((s: any) => ({
          code: s.f12,
          name: s.f14,
          percent: s.f3,
          price: s.f2,
          limitDays: Math.abs(s.f62 || 0),
          amount: s.f6 || 0
        }))
      const totalAmount = stocks.reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
      return { stocks, totalAmount }
    }
    return { stocks: [], totalAmount: 0 }
  } catch (e) {
    console.log(`跌停API错误: ${e}`)
    return { stocks: [], totalAmount: 0 }
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
        name: s.f14,
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
      total_volume: '0',
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
  const { error } = await supabase
    .from('concept_rankings')
    .upsert({
      stat_date: date,
      concepts: concepts,
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
    const url = new URL(req.url)
    const days = parseInt(url.searchParams.get('days') || '1')
    const today = new Date().toISOString().split('T')[0]
    const todayFormatted = today.replace(/-/g, '')
    
    console.log(`=== 开始采集近${days}日数据 ===`)
    
    // 采集今日数据
    const [limitUpResult, limitDownResult, concepts] = await Promise.all([
      fetchLimitUp(todayFormatted),
      fetchLimitDown(todayFormatted),
      fetchConceptRank()
    ])
    
    const maxLimit = limitUpResult.stocks.length > 0 
      ? Math.max(...limitUpResult.stocks.map((s: any) => s.limitDays || 0))
      : 0
    
    // 保存今日数据（使用涨停成交额）
    await saveDailyStats({
      date: today,
      limitUpCount: limitUpResult.stocks.length,
      limitDownCount: limitDownResult.stocks.length,
      totalAmount: limitUpResult.totalAmount,
      maxContinuousLimit: maxLimit
    })
    
    await saveLimitUpStocks(today, limitUpResult.stocks)
    await saveLimitDownStocks(today, limitDownResult.stocks)
    await saveConcepts(today, concepts)
    
    console.log(`今日: 涨停${limitUpResult.stocks.length}只, 成交额${(limitUpResult.totalAmount/1e8).toFixed(0)}亿`)
    
    // 采集历史数据
    const historyResults = []
    for (let i = 1; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateFormatted = dateStr.replace(/-/g, '')
      
      console.log(`采集 ${dateStr}...`)
      
      try {
        const [ztResult, dtResult] = await Promise.all([
          fetchLimitUp(dateFormatted),
          fetchLimitDown(dateFormatted)
        ])
        
        const maxL = ztResult.stocks.length > 0 
          ? Math.max(...ztResult.stocks.map((s: any) => s.limitDays || 0)) 
          : 0
        
        await saveDailyStats({
          date: dateStr,
          limitUpCount: ztResult.stocks.length,
          limitDownCount: dtResult.stocks.length,
          totalAmount: ztResult.totalAmount,
          maxContinuousLimit: maxL
        })
        
        historyResults.push({
          date: dateStr,
          limitUp: ztResult.stocks.length,
          limitDown: dtResult.stocks.length,
          amount: ztResult.totalAmount
        })
        
        console.log(`  ${dateStr}: 涨停${ztResult.stocks.length}只, 成交额${(ztResult.totalAmount/1e8).toFixed(0)}亿`)
      } catch (e) {
        console.log(`${dateStr}采集失败: ${e}`)
      }
      
      // 避免请求过快
      await new Promise(r => setTimeout(r, 500))
    }
    
    console.log('=== 采集完成 ===')
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        today: {
          date: today,
          limitUpCount: limitUpResult.stocks.length,
          limitDownCount: limitDownResult.stocks.length,
          totalAmount: limitUpResult.totalAmount,
          maxContinuousLimit: maxLimit,
          limitUp: limitUpResult.stocks.slice(0, 30),
          limitDown: limitDownResult.stocks.slice(0, 30)
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
