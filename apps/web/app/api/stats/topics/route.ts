import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { createClient } from '@supabase/supabase-js'

// 强制动态渲染，禁止任何缓存
export const dynamic = 'force-dynamic'
export const revalidate = 0

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * 验证日期是否为A股交易日（排除周末）
 */
function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr)
  const day = date.getDay()
  return day === 0 || day === 6 // 周日或周六
}

interface TopicRow {
  topic_code: string
  topic_name: string
  change_percent: number
  close_price: number
  rank: number
}

/**
 * GET /api/stats/topics
 * GET /api/stats/topics?date=2026-02-12
 * 获取所有有数据的日期列表，或指定日期的题材排行TOP10
 */

/**
 * 获取所有有数据的日期列表
 */
async function getAvailableDates() {
  const { data, error } = await supabase
    .from('topic_rankings')
    .select('stat_date')
    .order('stat_date', { ascending: false })
  
  if (error) {
    console.error('[API] 查询可用日期失败:', error)
    return []
  }
  
  // 去重
  const dates = [...new Set(data?.map(d => d.stat_date) || [])]
  return dates
}
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const date = searchParams.get('date')

      // 如果没有提供日期，返回所有有数据的日期列表
      if (!date) {
        const dates = await getAvailableDates()
        return NextResponse.json(createSuccessResponse({ dates }))
      }

      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', '日期格式错误，请使用 YYYY-MM-DD'),
          { status: 400 }
        )
      }

      // 验证是否为交易日（排除周末）
      if (isWeekend(date)) {
        return NextResponse.json(
          createErrorResponse('NON_TRADING_DAY', `${date} 为周末，非交易日`),
          { status: 400 }
        )
      }

      // 获取指定日期的题材数据（获取更多数据用于合并）
      const { data, error } = await supabase
        .from('topic_rankings')
        .select('topic_code, topic_name, change_percent, close_price, rank')
        .eq('stat_date', date)
        .order('change_percent', { ascending: false })

      if (error) {
        console.error('[API] 查询题材数据失败:', error)
        return NextResponse.json(
          createErrorResponse('SERVER_ERROR', error.message),
          { status: 500 }
        )
      }

      // 合并相同板块的 I、II、III 层级
      // 例如：航空装备Ⅲ + 航空装备Ⅱ → 航空装备
      const mergedMap = new Map<string, TopicRow>()
      
      for (const item of (data || [])) {
        // 去掉层级后缀：航空装备Ⅲ → 航空装备
        const baseName = item.topic_name.replace(/[ⅠⅡⅢⅠⅡⅢ]+$/, '').trim()
        
        if (!mergedMap.has(baseName)) {
          // 第一次遇到，添加到 map
          mergedMap.set(baseName, {
            topic_code: item.topic_code,
            topic_name: baseName,
            change_percent: item.change_percent,
            close_price: item.close_price,
            rank: item.rank,
          })
        } else {
          // 已存在，比较涨幅，保留最高的
          const existing = mergedMap.get(baseName)!
          if (item.change_percent > existing.change_percent) {
            existing.change_percent = item.change_percent
            existing.close_price = item.close_price
            existing.topic_code = item.topic_code
          }
        }
      }

      // 转换为数组并按涨幅排序，取 TOP10
      const topics = Array.from(mergedMap.values())
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, 10)
        .map((item) => ({
          topicCode: item.topic_code,
          topicName: item.topic_name,
          changePercent: item.change_percent,
          closePrice: item.close_price,
        }))

      return NextResponse.json(createSuccessResponse(topics))
    } catch (error: any) {
      console.error('[API] 获取题材数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
