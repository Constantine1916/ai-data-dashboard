import { NextRequest, NextResponse } from 'next/server'
import { createErrorResponse, ERROR_CODES, HTTP_STATUS } from '@ai-data-dashboard/shared'

/**
 * API 错误处理中间件
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API 错误:', error)

  if (error instanceof Error) {
    // 数据库连接错误
    if (error.message.includes('getaddrinfo ENOTFOUND') || error.message.includes('ENOTFOUND')) {
      return NextResponse.json(
        createErrorResponse(
          'DATABASE_CONNECTION_ERROR',
          '无法连接到数据库。请检查 DATABASE_URL 环境变量配置是否正确，或确认数据库服务是否可用。'
        ),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // 数据库认证错误
    if (error.message.includes('password authentication failed') || error.message.includes('authentication failed')) {
      return NextResponse.json(
        createErrorResponse(
          'DATABASE_AUTH_ERROR',
          '数据库认证失败。请检查数据库用户名和密码是否正确。'
        ),
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // 已知错误
    return NextResponse.json(
      createErrorResponse(ERROR_CODES.INTERNAL_ERROR, error.message),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }

  // 未知错误
  return NextResponse.json(
    createErrorResponse(
      ERROR_CODES.INTERNAL_ERROR,
      '服务器内部错误'
    ),
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  )
}

/**
 * 验证请求方法
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[]
): NextResponse | null {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      createErrorResponse(
        ERROR_CODES.VALIDATION_ERROR,
        `不允许的请求方法: ${request.method}`
      ),
      { status: HTTP_STATUS.BAD_REQUEST }
    )
  }
  return null
}

/**
 * 解析 JSON 请求体
 */
export async function parseJsonBody<T = unknown>(
  request: NextRequest
): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('无效的 JSON 请求体')
  }
}
