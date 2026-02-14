'use client'

import { useState, useEffect } from 'react'

interface MarketIndex {
  code: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  amount: number
}

interface MarketIndicesProps {
  initialData?: MarketIndex[]
}

export function MarketIndices({ initialData }: MarketIndicesProps) {
  const [indices, setIndices] = useState<MarketIndex[]>(initialData || [])
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    if (!initialData) {
      fetchIndices()
    }
    // 不自动刷新，只在页面加载时获取一次
  }, [initialData])

  const fetchIndices = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats/indices')
      const data = await res.json()

      if (data.success) {
        setIndices(data.data)
        setLastUpdate(new Date().toLocaleTimeString('zh-CN'))
        setError(null)
      } else {
        setError(data.error?.message || '获取数据失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: number) => {
    if (amount <= 0) return ''  // 腾讯API对指数不返回成交额
    if (amount >= 1e12) return `${(amount / 1e12).toFixed(2)}万亿`
    if (amount >= 1e11) return `${(amount / 1e11).toFixed(1)}千亿`
    if (amount >= 1e10) return `${(amount / 1e10).toFixed(1)}百亿`
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}十亿`
    if (amount >= 1e8) return `${(amount / 1e8).toFixed(0)}亿`
    return `${(amount / 1e6).toFixed(0)}万`
  }

  const getColor = (percent: number) => {
    if (percent > 0) return 'text-red-600'
    if (percent < 0) return 'text-green-600'
    return 'text-gray-600'
  }

  const getBgColor = (percent: number) => {
    if (percent > 0) return 'bg-red-50'
    if (percent < 0) return 'bg-green-50'
    return 'bg-gray-50'
  }

  if (loading && indices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && indices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">❌ {error}</p>
          <button
            onClick={fetchIndices}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">📈 大A主要指数</h2>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              更新: {lastUpdate}
            </span>
          )}
        </div>
      </div>

      {/* 指数卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {indices
          .filter((i) => i.price > 0)
          .map((index) => (
            <div
              key={index.code}
              className={`${getBgColor(index.changePercent)} rounded-lg p-4 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{index.name}</span>
                {index.changePercent > 0 ? (
                  <span className="text-red-500">↑</span>
                ) : index.changePercent < 0 ? (
                  <span className="text-green-500">↓</span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </div>
              <div className={`text-2xl font-bold ${getColor(index.changePercent)}`}>
                {index.price.toFixed(2)}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm font-medium ${getColor(index.changePercent)}`}>
                  {index.changePercent >= 0 ? '+' : ''}{index.changePercent.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500">
                  {formatAmount(index.amount)}
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* 快捷统计 */}
      {indices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">上涨:</span>
              <span className="text-red-600 font-medium">
                {indices.filter((i) => i.changePercent > 0).length}只
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">下跌:</span>
              <span className="text-green-600 font-medium">
                {indices.filter((i) => i.changePercent < 0).length}只
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">平盘:</span>
              <span className="text-gray-600 font-medium">
                {indices.filter((i) => i.changePercent === 0).length}只
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
