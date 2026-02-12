import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { EastMoneyService } from '@/lib/services/eastmoney'

/**
 * GET /api/stats/indices
 * 获取大A主要指数实时数据
 */
export const GET = createRouteHandler({
  GET: async () => {
    try {
      const indices = await EastMoneyService.getMarketIndices()

      if (!indices || indices.length === 0) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', '获取指数数据失败'),
          { status: 500 }
        )
      }

      return NextResponse.json(createSuccessResponse(indices))
    } catch (error: any) {
      console.error('[API] 获取指数数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
