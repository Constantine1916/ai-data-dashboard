import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { isTradingDay } from '@/lib/services/trading-day'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * POST /api/stats/collect
 * 通过 Supabase Edge Function 收集数据
 * 先判断是否为交易日期，非交易日不采集
 */
export const POST = createRouteHandler({
  POST: async () => {
    try {
      // 先判断是否为交易日期
      const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]
      const trading = await isTradingDay(today)
      
      if (!trading) {
        return NextResponse.json(
          createSuccessResponse({
            skipped: true,
            message: `今日 ${today} 为非交易日期（节假日/周末），跳过数据采集`,
            lastTradingDate: null
          })
        )
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/collect-stock-stats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || '调用数据收集失败')
      }

      return NextResponse.json(data)
    } catch (error: any) {
      console.error('[API] 数据收集失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '数据收集失败'),
        { status: 500 }
      )
    }
  },
})
