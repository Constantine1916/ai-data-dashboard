import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'

// 标记为动态路由
export const dynamic = 'force-dynamic'

/**
 * 使用东方财富的搜索 API（更稳定）
 */
async function searchFromEastMoney(keyword: string) {
  try {
    const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&count=5`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://quote.eastmoney.com/',
      },
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    if (!data.QuotationCodeTable?.Data) {
      return []
    }
    
    return data.QuotationCodeTable.Data.map((item: any) => ({
      code: item.SecurityTypeName === '上海' ? `SH${item.Code}` : `SZ${item.Code}`,
      name: item.Name,
      now: 0,  // 搜索建议不返回实时价格
      percent: 0,
    }))
  } catch (error) {
    console.error('[EastMoney] 搜索失败:', error)
    return []
  }
}

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

      // 使用东方财富搜索（更稳定）
      const suggestions = await searchFromEastMoney(query.trim())
      
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
