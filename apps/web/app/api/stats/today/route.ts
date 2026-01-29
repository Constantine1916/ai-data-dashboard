import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { MarketStatsService } from '@/lib/services/market-stats'

/**
 * GET /api/stats/today
 * 获取今日市场统计数据（实时）
 */
export const GET = createRouteHandler({
  GET: async () => {
    try {
      const stats = await MarketStatsService.getTodayStats()

      if (!stats) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', '今日数据尚未收集，请稍后再试'),
          { status: 404 }
        )
      }

      return NextResponse.json(createSuccessResponse(stats))
    } catch (error: any) {
      console.error('[API] 获取今日统计数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
