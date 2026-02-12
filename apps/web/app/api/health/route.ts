import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse } from '@/lib/shared'
import { healthCheck } from '@/lib/db'

export const GET = createRouteHandler({
  GET: async (request: NextRequest) => {
    const dbHealthy = await healthCheck()
    
    return NextResponse.json(
      createSuccessResponse({
        status: 'ok',
        message: 'API is running',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      })
    )
  },
})
