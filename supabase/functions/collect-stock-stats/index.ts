import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

const TENCENT_API = 'https://qt.gtimg.cn/q'
const TIMEOUT_MS = 60000

interface Stock {
  code: string
  name: string
  now: number
  yesterday: number
  percent: number
}

async function fetchStock(codes: string[]): Promise<Stock[]> {
  const url = `${TENCENT_API}=${codes.join(',')}`
  console.log(`请求: ${url}`)
  
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    
    if (!res.ok) {
      console.log(`HTTP错误: ${res.status}`)
      return []
    }
    
    const buffer = await res.arrayBuffer()
    const text = new TextDecoder('gbk').decode(buffer)
    console.log(`收到数据长度: ${text.length}`)
    
    const stocks: Stock[] = []
    const rows = text.split(';').filter((r: string) => r.trim())
    
    for (const code of codes) {
      const row = rows.find((r: string) => r.includes(code))
      if (row) {
        const match = row.match(new RegExp(`${code}=([^;]+)`))
        if (match) {
          const parts = match[1].replace(/^"|"$/g, '').split('~')
          if (parts.length >= 5) {
            const now = parseFloat(parts[3]) || 0
            const yesterday = parseFloat(parts[4]) || 0
            stocks.push({
              code,
              name: parts[1],
              now,
              yesterday,
              percent: yesterday > 0 ? (now - yesterday) / yesterday : 0
            })
          }
        }
      }
    }
    
    console.log(`解析成功: ${stocks.length}/${codes.length}`)
    return stocks
  } catch (e: any) {
    console.log(`请求失败: ${e.message}`)
    return []
  }
}

async function getMarketStats() {
  // 高成交额股票
  const codes = [
    // 上海大市值
    'sh600519','sh601318','sh600036','sh601857','sh601288',
    'sh600030','sh600016','sh600276','sh600111','sh601166',
    'sh601398','sh601939','sh601988','sh601989','sh601006',
    'sh600000','sh600015','sh600018','sh600019','sh600009',
    // 深圳大市值
    'sz000001','sz000002','sz000004','sz000005','sz000006',
    'sz000007','sz000008','sz000009','sz000010','sz000011',
    'sz000012','sz000013','sz000014','sz000015','sz000016',
    'sz000017','sz000018','sz000019','sz000020','sz000021',
    // 中小板+创业板
    'sz002001','sz002002','sz002003','sz002004','sz002005',
    'sz002006','sz002007','sz002008','sz002009','sz002010',
    'sz002011','sz002012','sz002013','sz002014','sz002015',
    'sz002016','sz002017','sz002018','sz002019','sz002020',
    'sz300001','sz300002','sz300003','sz300004','sz300005',
    'sz300006','sz300007','sz300008','sz300009','sz300010',
    'sz300011','sz300012','sz300013','sz300014','sz300015',
  ]
  
  console.log(`采样 ${codes.length} 只股票`)
  const stocks = await fetchStock(codes)
  
  // 统计
  const limitUp = stocks.filter(s => 
    s.percent >= 0.099 && 
    !s.name.includes('ST') && 
    !s.name.includes('*') &&
    s.now > 0
  )
  
  const limitDown = stocks.filter(s => 
    s.percent <= -0.099 && 
    !s.name.includes('ST') && 
    !s.name.includes('*') &&
    s.now > 0
  )
  
  console.log(`涨停: ${limitUp.length}, 跌停: ${limitDown.length}`)
  console.log(`涨停股票: ${limitUp.map(s => `${s.code}(${s.name}:${(s.percent*100).toFixed(1)}%)`).join(', ')}`)
  
  return { limitUpCount: limitUp.length, limitDownCount: limitDown.length }
}

async function saveStats(date: string, stats: any) {
  const { error } = await supabase
    .from('daily_market_stats')
    .upsert({
      stat_date: date,
      limit_up_count: stats.limitUpCount,
      limit_down_count: stats.limitDownCount,
      total_volume: '0',
      total_amount: '0',
      max_continuous_limit: 0,
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
    const stats = await getMarketStats()
    await saveStats(today, stats)
    
    console.log(`=== 完成: 涨停${stats.limitUpCount}, 跌停${stats.limitDownCount} ===`)
    
    return new Response(JSON.stringify({
      success: true,
      data: { success: true, date: today, stats }
    }), { headers })
  } catch (e: any) {
    console.log(`错误: ${e.message}`)
    return new Response(JSON.stringify({
      success: false,
      error: { code: 'SERVER_ERROR', message: e.message }
    }), { status: 500, headers })
  }
})
