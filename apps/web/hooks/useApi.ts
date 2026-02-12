'use client'

import { useState, useCallback } from 'react'
import type { ApiResponse } from '@/lib/shared'

interface UseApiOptions {
  onSuccess?: (data: unknown) => void
  onError?: (error: Error) => void
}

/**
 * API 调用 Hook
 */
export function useApi<T = unknown>(options?: UseApiOptions) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(
    async (url: string, init?: RequestInit) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
        })

        const result: ApiResponse<T> = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(
            result.error?.message || `HTTP error! status: ${response.status}`
          )
        }

        setData(result.data as T)
        options?.onSuccess?.(result.data as T)
        return result.data as T
      } catch (err) {
        const error = err instanceof Error ? err : new Error('未知错误')
        setError(error)
        options?.onError?.(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [options]
  )

  return { data, loading, error, execute }
}
