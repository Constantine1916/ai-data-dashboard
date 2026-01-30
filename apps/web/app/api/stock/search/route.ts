import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { stocks } from 'stock-api'

/**
 * GET /api/stock/search?code=SH600519
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
      
      // 格式化代码（如果用户只输入了数字，自动判断交易所）
      let formattedCode = code.toUpperCase()
      
      // 如果只是数字，自动添加交易所前缀
      if (/^\d+$/.test(code)) {
        // 沪市：60xxxx, 688xxx（科创板）
        // 深市：00xxxx, 300xxx（创业板）, 301xxx（创业板注册制）
        if (code.startsWith('6')) {
          formattedCode = `SH${code}`
        } else if (code.startsWith('0') || code.startsWith('3')) {
          formattedCode = `SZ${code}`
        } else {
          return NextResponse.json(
            createErrorResponse('INVALID_CODE', '无法识别的股票代码'),
            { status: 400 }
          )
        }
      }
      
      // 尝试多个数据源
      let stockData = null
      let source = ''
      
      // 先尝试网易财经
      try {
        stockData = await stocks.netease.getStock(formattedCode)
        source = 'netease'
      } catch (error) {
        console.log('[Stock Search] 网易财经查询失败，尝试腾讯...')
        
        // 如果网易失败，尝试腾讯
        try {
          stockData = await stocks.tencent.getStock(formattedCode)
          source = 'tencent'
        } catch (tencentError) {
          console.error('[Stock Search] 所有数据源查询失败:', tencentError)
          throw new Error('股票查询失败，请检查代码是否正确')
        }
      }
      
      // 检查是否找到数据
      if (!stockData || stockData.code === 'UNKNOWN') {
        return NextResponse.json(
          createErrorResponse('NOT_FOUND', '未找到该股票，请检查代码是否正确'),
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        createSuccessResponse({
          ...stockData,
          source,  // 返回数据来源
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
