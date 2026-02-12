import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// 东方财富涨停API (涨跌幅降序)
async function fetchLimitUp(date: string): Promise<any[]> {
  const url = `https://push2.eastmoney.com/api/qt/stock/ztlist/get?pn=1&pz=500&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f62,f8`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.data?.diff) {
      return data.data.diff.map((s: any) => ({
        code: s.f12,
        name: s.f14,
        percent: s.f3,
        price: s.f2,
        limitDays: s.f62 || 0
      }))
    }
    return []
  } catch (e) {
    console.log(`涨停API错误: ${e.message}`)
    return []
  }
}

// 东方财富跌停API (涨跌幅升序)
async function fetchLimitDown(date: string): Promise<any[]> {
  const url = `https://push2.eastmoney.com/api/qt/stock/ztlist/get?pn=1&pz=500&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23&fields=f12,f14,f2,f3,f62,f8`
  
  try {
    const res = await fetch(url)
    const data = await res.json()
    
    if (data.data?.diff) {
      // 筛选跌停的（涨幅 <= -9.9%）
      return data.data.diff
        .filter((s: any) => s.f3 <= -9.9)
        .map((s: any) => ({
          code: s.f12,
          name: s.f14,
          percent: s.f3,
          price: s.f2,
          limitDays: Math.abs(s.f62 || 0)
        }))
    }
    return []
  } catch (e) {
    console.log(`跌停API错误: ${e.message}`)
    return []
  }
}

// 保存数据
async function saveStats(date: string, stats: any) {
  const { error } = await supabase
    .from('daily_market_stats')
    .upsert({
      stat_date: date,
      limit_up_count: stats.limitUpCount,
      limit_down_count: stats.limitDownCount,
      total_volume: String(stats.totalVolume || 0),
      total_amount: String(stats.totalAmount || 0),
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
    console.log('=== 开始收集数据 ===')
    const today = new Date().toISOString().split('T')[0]
    
    // 并行获取涨跌停数据
    const [limitUp, limitDown] = await Promise.all([
      fetchLimitUp(today),
      fetchLimitDown(today)
    ])
    
    const maxLimit = limitUp.length > 0 
      ? Math.max(...limitUp.map((s: any) => s.limitDays || 0))
      : 0
    
    const stats = {
      limitUpCount: limitUp.length,
      limitDownCount: limitDown.length,
      totalVolume: 0,
      totalAmount: 0,
      maxContinuousLimit: maxLimit,
    }
    
    // 保存到数据库
    await saveStats(today, stats)
    
    console.log(`=== 完成: 涨停${stats.limitUpCount}, 跌停${stats.limitDownCount} ===`)
    
    return new Response(JSON.stringify({
      success: true,
      data: {
        date: today,
        stats,
        limitUp: limitUp.slice(0, 50),
        limitDown: limitDown.slice(0, 50)
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
