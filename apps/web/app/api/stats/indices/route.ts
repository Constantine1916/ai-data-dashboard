import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { EastMoneyService } from '@/lib/services/eastmoney'

/**
 * GET /api/stats/indices
 * 获取大A主要指数实时数据
 * 注意：腾讯API对指数不提供成交额数据，价格/涨跌幅数据正常
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

      // 腾讯API对指数不返回成交额，amount为0是正常的
      // 实际成交额数据请参考 /api/stats/history 接口
      const result = indices.map(index => ({
        ...index,
        amount: index.price > 0 ? 0 : 0, // 腾讯API不提供指数成交额
      }))

      return NextResponse.json(createSuccessResponse(result))
    } catch (error: any) {
      console.error('[API] 获取指数数据失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '服务器错误'),
        { status: 500 }
      )
    }
  },
})
