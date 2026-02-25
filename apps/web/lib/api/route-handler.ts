import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'
import { handleApiError, validateMethod } from './middleware'

type RouteHandler = (
  request: NextRequest,
  context: any
) => Promise<NextResponse>

/**
 * 创建 API 路由处理器包装器
 * 兼容 Next.js 15
 */
export function createRouteHandler(
  handlers: {
    GET?: RouteHandler
    POST?: RouteHandler
    PUT?: RouteHandler
    DELETE?: RouteHandler
    PATCH?: RouteHandler
  },
  options?: {
    noCache?: boolean  // 是否禁用缓存
  }
) {
  return async (
    request: NextRequest,
    context: any
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

      // 执行处理器
      const response = await handler(request, context)
      
      // 如果需要禁用缓存
      if (options?.noCache) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
        response.headers.set('Pragma', 'no-cache')
        response.headers.set('Expires', '0')
      }
      
      return response
    } catch (error) {
      return handleApiError(error)
    }
  }
}
