import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { searchStock } from '@/lib/services/stock-search'

// 标记为动态路由
export const dynamic = 'force-dynamic'

/**
 * GET /api/stock/search?code=600519
 * 搜索股票实时数据
 */
export const GET = createRouteHandler({
  GET: async (request) => {
    try {
      const { searchParams } = new URL(request.url)
      const code = searchParams.get('code')
      
      if (!code) {
        return NextResponse.json(
          createErrorResponse('INVALID_PARAMS', '请提供股票代码'),
          { status: 400 }
        )
      }
      
      const result = await searchStock(code)
      
      if (!result.data) {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', result.error || '未找到该股票'),
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        createSuccessResponse({
          ...result.data,
          source: result.source,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error: any) {
      console.error('[API] 股票搜索失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '股票搜索失败'),
        { status: 500 }
      )
    }
  },
})
