import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { MarketStatsService } from '@/lib/services/market-stats'

/**
 * GET /api/stats/today
 * 获取今日市场统计数据（实时）
 * 如果今日数据尚未收集，返回最近一个交易日的数据
 */
export const GET = createRouteHandler({
  GET: async () => {
    try {
      const stats = await MarketStatsService.getTodayStats()

      if (!stats) {
        // 如果今日没有数据，获取最近一个交易日的数据
        const recentStats = await MarketStatsService.getRecentStats(7)
        if (recentStats.length > 0) {
          const latestStat = recentStats[0]
          return NextResponse.json(
            createSuccessResponse({
              ...latestStat,
              isFallback: true, // 标记为备用数据
            })
          )
        }
        
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', '暂无市场统计数据'),
          { status: 404 }
        )
      }

      return NextResponse.json(createSuccessResponse(stats), {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      })
    } catch (error: any) {
      console.error('[API] 获取今日统计数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
