import type { ApiResponse } from '../types'

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }
}

/**
 * 创建错误响应
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  }
}

/**
 * 验证分页参数
 */
export function validatePagination(
  page?: number,
  pageSize?: number
): { page: number; pageSize: number } {
  const validPage = Math.max(1, page || 1)
  const validPageSize = Math.min(Math.max(1, pageSize || 10), 100)
  return { page: validPage, pageSize: validPageSize }
}
