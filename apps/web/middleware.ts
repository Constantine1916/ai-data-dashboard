import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 中间件
 * 用于处理请求级别的逻辑，如认证、CORS、日志等
 */
export function middleware(request: NextRequest) {
  // 可以在这里添加：
  // - 认证检查
  // - CORS 头设置
  // - 请求日志
  // - 重定向逻辑

  // 示例：为 API 路由添加 CORS 头
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }

  return NextResponse.next()
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon文件)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
