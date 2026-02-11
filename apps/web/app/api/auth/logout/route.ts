import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse } from '@ai-data-dashboard/shared'
import { clearAuthCookie } from '@/lib/auth/cookies'

export const POST = createRouteHandler({
  POST: async (request, _context) => {
    // 创建响应
    const response = NextResponse.json(
      createSuccessResponse({ message: '登出成功' })
    )

    // 清除 Cookie 中的 Token
    clearAuthCookie(response)

    return response
  },
})
