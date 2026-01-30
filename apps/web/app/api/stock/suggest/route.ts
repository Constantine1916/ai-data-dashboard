import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'

// 标记为动态路由
export const dynamic = 'force-dynamic'

/**
 * GET /api/stock/suggest?q=茅台
 * 股票名称搜索建议
 */
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const query = searchParams.get('q')
      
      if (!query || query.trim().length === 0) {
        return NextResponse.json(
          createSuccessResponse([])
        )
      }

      // 动态导入 stock-api
      const { stocks } = await import('stock-api')
      
      // 使用网易财经搜索
      const results = await stocks.netease.searchStocks(query.trim())
      
      // 格式化返回结果
      const suggestions = results
        .filter((stock: any) => stock.code && stock.name)
        .map((stock: any) => ({
          code: stock.code,
          name: stock.name,
          now: stock.now || 0,
          percent: stock.percent || 0,
        }))
      
      return NextResponse.json(
        createSuccessResponse(suggestions)
      )
    } catch (error: any) {
      console.error('[API] 股票搜索建议失败:', error)
      return NextResponse.json(
        createSuccessResponse([])  // 搜索失败返回空数组，不报错
      )
    }
  },
})
