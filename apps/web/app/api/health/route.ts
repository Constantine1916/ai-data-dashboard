import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse } from '@/lib/shared'
import { supabase } from '@/lib/db/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function healthCheck(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('daily_market_stats')
      .select('id')
      .limit(1)

    return !error
  } catch {
    return false
  }
}

export const GET = createRouteHandler({
  GET: async (request: NextRequest) => {
    const dbHealthy = await healthCheck()
    
    return NextResponse.json(
      createSuccessResponse({
        status: 'ok',
        message: 'API is running',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  },
})
