'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 记录错误到错误监控服务
    console.error('应用错误:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          出错了
        </h1>
        <p className="text-gray-600 mb-6">
          {error.message || '发生了未知错误'}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-500 mb-6">
            错误 ID: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            重试
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
          >
            返回首页
          </Button>
        </div>
      </div>
    </div>
  )
}
