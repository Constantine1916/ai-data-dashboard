import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface TopicRow {
  topic_code: string
  topic_name: string
  change_percent: number
  close_price: number
  rank: number
}

/**
 * GET /api/stats/topics?date=2026-02-12
 * 获取指定日期的题材排行TOP10
 */
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const date = searchParams.get('date')

      if (!date) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', '缺少 date 参数'),
          { status: 400 }
        )
      }

      // 验证日期格式
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', '日期格式错误，请使用 YYYY-MM-DD'),
          { status: 400 }
        )
      }

      // 获取指定日期的题材数据
      const { data, error } = await supabase
        .from('topic_rankings')
        .select('topic_code, topic_name, change_percent, close_price, rank')
        .eq('stat_date', date)
        .order('change_percent', { ascending: false })
        .limit(10)

      if (error) {
        console.error('[API] 查询题材数据失败:', error)
        return NextResponse.json(
          createErrorResponse('SERVER_ERROR', error.message),
          { status: 500 }
        )
      }

      // 格式化返回数据
      const topics = (data || []).map((item: TopicRow) => ({
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
