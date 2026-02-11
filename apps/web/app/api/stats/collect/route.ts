import { NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@ai-data-dashboard/shared'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * POST /api/stats/collect
 * 通过 Supabase Edge Function 收集数据
 */
export const POST = createRouteHandler({
  POST: async () => {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/collect-stock-stats`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || '调用数据收集失败')
      }

      return NextResponse.json(data)
    } catch (error: any) {
      console.error('[API] 数据收集失败:', error)
      return NextResponse.json(
        createErrorResponse('SERVER_ERROR', error.message || '数据收集失败'),
        { status: 500 }
      )
    }
  },
})
