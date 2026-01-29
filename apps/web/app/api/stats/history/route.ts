import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { MarketStatsService } from '@/lib/services/market-stats'

/**
 * GET /api/stats/history?days=30
 * 获取近N天的市场统计数据（用于折线图）
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

      const stats = await MarketStatsService.getRecentStats(days)

      return NextResponse.json(createSuccessResponse(stats))
    } catch (error: any) {
      console.error('[API] 获取历史统计数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
