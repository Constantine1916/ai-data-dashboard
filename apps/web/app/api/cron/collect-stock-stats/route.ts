import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse, createErrorResponse } from '@/lib/shared'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const CRON_SECRET = process.env.CRON_SECRET ?? ''
const COLLECT_DAYS = 30

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isAuthorizedCronRequest(request: NextRequest) {
  if (!CRON_SECRET) return false
  return request.headers.get('authorization') === `Bearer ${CRON_SECRET}`
}

export const GET = createRouteHandler({
  GET: async (request: NextRequest) => {
    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', '未授权的定时任务请求'),
        { status: 401 }
      )
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/collect-stock-stats?days=${COLLECT_DAYS}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    const data = await response.json()
    if (!response.ok || !data.success) {
      return NextResponse.json(
        createErrorResponse(
          data.error?.code || 'COLLECT_FAILED',
          data.error?.message || '定时采集失败'
        ),
        { status: response.ok ? 500 : response.status }
      )
    }

    return NextResponse.json(
      createSuccessResponse({
        days: COLLECT_DAYS,
        schedule: '0 9 * * *',
        timezone: 'Asia/Beijing',
        triggeredAt: new Date().toISOString(),
        today: data.data?.today
          ? {
              date: data.data.today.date,
              limitUpCount: data.data.today.limitUpCount,
              limitDownCount: data.data.today.limitDownCount,
              totalAmount: data.data.today.totalAmount,
              maxContinuousLimit: data.data.today.maxContinuousLimit,
            }
          : null,
        historyCount: data.data?.history?.length || 0,
      }),
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  },
})
