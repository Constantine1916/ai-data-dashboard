import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse } from '@ai-data-dashboard/shared'

export const POST = createRouteHandler({
  POST: async (request) => {
    // 登出主要是前端清除 Token
    // 如果使用 Session，这里可以删除会话记录
    // 如果使用 JWT，前端删除 Token 即可

    return Response.json(
      createSuccessResponse({ message: '登出成功' })
    )
  },
})
