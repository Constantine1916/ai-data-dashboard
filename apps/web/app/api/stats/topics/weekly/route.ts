import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { MarketStatsService } from '@/lib/services/market-stats'

/**
 * GET /api/stats/topics/weekly?limit=20
 * 获取一周内题材涨幅排行
 */
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const limit = parseInt(searchParams.get('limit') || '20', 10)

      const topics = await MarketStatsService.getWeeklyTopicRankings(limit)

      return NextResponse.json(createSuccessResponse(topics))
    } catch (error: any) {
      console.error('[API] 获取题材涨幅失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
