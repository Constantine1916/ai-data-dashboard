import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { MarketStatsService } from '@/lib/services/market-stats'
import { isTradingDay } from '@/lib/services/trading-day'

/**
 * 过滤掉非交易日（周末 + 节假日）
 */
async function isNonTradingDay(dateStr: string): Promise<boolean> {
  // 先检查是否是周末
  const date = new Date(dateStr)
  const day = date.getDay()
  // 0 = 周日, 6 = 周六
  if (day === 0 || day === 6) return true
  
  // 再检查是否是节假日（通过API判断）
  const trading = await isTradingDay(dateStr)
  return !trading
}

/**
 * GET /api/stats/history?days=30
 * 获取近N天的市场统计数据（用于折线图）
 * 自动过滤掉非交易日（周末 + 节假日）
 */
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const days = parseInt(searchParams.get('days') || '30', 10)

      if (days < 1 || days > 365) {
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', 'days 参数必须在 1-365 之间'),
          { status: 400 }
        )
      }

      let stats = await MarketStatsService.getRecentStats(days)

      // 过滤掉非交易日
      const filteredStats: typeof stats = []
      for (const s of stats) {
        if (!await isNonTradingDay(s.statDate)) {
          filteredStats.push(s)
        }
      }

      return NextResponse.json(createSuccessResponse(filteredStats))
    } catch (error: any) {
      console.error('[API] 获取历史统计数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
