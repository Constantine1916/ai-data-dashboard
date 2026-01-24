import { NextRequest } from 'next/server'
import { createRouteHandler } from '@/lib/api/route-handler'
import { createSuccessResponse } from '@ai-data-dashboard/shared'
import { healthCheck } from '@/lib/db'

export const GET = createRouteHandler({
  GET: async (request: NextRequest) => {
    const dbHealthy = await healthCheck()
    
    return Response.json(
      createSuccessResponse({
        status: 'ok',
        message: 'API is running',
        database: dbHealthy ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      })
    )
  },
})
