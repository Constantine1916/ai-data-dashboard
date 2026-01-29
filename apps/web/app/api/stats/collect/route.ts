import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { MarketStatsService } from '@/lib/services/market-stats'

/**
 * POST /api/stats/collect
 * 手动触发数据收集任务（也会被定时任务调用）
 */
export const POST = createRouteHandler({
  POST: async () => {
    try {
      const result = await MarketStatsService.runDailyCollection()

      return NextResponse.json(createSuccessResponse(result))
    } catch (error: any) {
      console.error('[API] 数据收集失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '数据收集失败'),
        { status: 500 }
      )
    }
  },
})
