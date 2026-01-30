import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'
import { handleApiError, validateMethod } from './middleware'

// Next.js 15+ Route Context type  
type RouteContext = {
  params: Promise<Record<string, string | string[]>>
}

/**
 * 创建 API 路由处理器包装器
 * 兼容 Next.js 15 的路由签名
 * 
 * 注意：处理器函数可以忽略 context 参数（用于不需要动态路由参数的路由）
 */
export function createRouteHandler(
  handlers: {
    GET?: (request: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
    POST?: (request: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
    PUT?: (request: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
    DELETE?: (request: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
    PATCH?: (request: NextRequest) => Promise<Response | NextResponse> | Response | NextResponse
  }
) {
  return async (
    request: NextRequest,
    _context: RouteContext
  ): Promise<NextResponse> => {
    try {
      const method = request.method
      const handler = handlers[method as keyof typeof handlers]

      if (!handler) {
        return NextResponse.json(
          createErrorResponse('METHOD_NOT_ALLOWED', `不允许的请求方法: ${method}`),
          { status: 405 }
        )
      }

      // 验证方法
      const methodError = validateMethod(request, Object.keys(handlers))
      if (methodError) {
        return methodError
      }

      // 执行处理器（不传递 context，因为现有代码不使用它）
      const result = await handler(request)
      
      // 确保返回 NextResponse
      if (result instanceof NextResponse) {
        return result
      }
      
      // 如果是普通 Response，转换为 NextResponse
      const data = await result.json()
      return NextResponse.json(data, { 
        status: result.status,
        statusText: result.statusText,
        headers: result.headers
      })
    } catch (error) {
      return handleApiError(error)
    }
  }
}
