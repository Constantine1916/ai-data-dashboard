'use client'

import { useState, useEffect } from 'react'
import type { DailyMarketStats } from '@/types/market'

interface MarketTrendChartProps {
  title: string
  dataKey: 'limitUpCount' | 'limitDownCount' | 'maxContinuousLimit' | 'totalAmount'
  color?: string
  days?: number
}

export function MarketTrendChart({ title, dataKey, color = '#3b82f6', days = 30 }: MarketTrendChartProps) {
  const [data, setData] = useState<DailyMarketStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHistoryData()
  }, [days])

  const fetchHistoryData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/stats/history?days=${days}`)
      const result = await res.json()

      if (result.success) {
        // 按日期升序排列（用于图表）
        setData(result.data.reverse())
        setError(null)
      } else {
        setError(result.error?.message || '获取数据失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: number) => {
    if (dataKey === 'totalAmount') {
      return `${(value / 100000000).toFixed(0)}亿`
    }
    if (dataKey === 'maxContinuousLimit') {
      return `${value}连`
    }
    return value
  }

  const getMaxValue = () => {
    if (data.length === 0) return 0
    return Math.max(...data.map((item) => {
      const val = item[dataKey]
      return typeof val === 'number' ? val : 0
    }))
  }

  const getMinValue = () => {
    if (data.length === 0) return 0
    return Math.min(...data.map((item) => {
      const val = item[dataKey]
      return typeof val === 'number' ? val : 0
    }))
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-yellow-800 text-sm">⚠️ 暂无历史数据</p>
          <p className="text-yellow-600 text-xs mt-2">
            数据将从今天开始累积，{days} 天后将显示完整趋势图
          </p>
        </div>
      </div>
    )
  }

  const maxValue = getMaxValue()
  const minValue = getMinValue()
  const latestValue = data[data.length - 1]?.[dataKey] || 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">近 {data.length} 天趋势</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color }}>
            {formatValue(typeof latestValue === 'number' ? latestValue : 0)}
          </div>
          <div className="text-xs text-gray-500">最新</div>
        </div>
      </div>

      {/* 简易折线图（SVG实现，不依赖第三方库） */}
      <div className="relative h-64 border border-gray-200 rounded-lg p-4 bg-gray-50">
        <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
          {/* 背景网格 */}
          <line x1="0" y1="0" x2="800" y2="0" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="0" y1="50" x2="800" y2="50" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" strokeWidth="1" />
          <line x1="0" y1="200" x2="800" y2="200" stroke="#e5e7eb" strokeWidth="1" />

          {/* 折线 */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="2"
            points={data
              .map((item, index) => {
                const val = item[dataKey]
                const value = typeof val === 'number' ? val : 0
                const x = (index / (data.length - 1 || 1)) * 800
                const y = 200 - ((value - minValue) / (maxValue - minValue || 1)) * 200
                return `${x},${y}`
              })
              .join(' ')}
          />

          {/* 填充区域 */}
          <polygon
            fill={color}
            fillOpacity="0.1"
            points={
              data
                .map((item, index) => {
                  const val = item[dataKey]
                  const value = typeof val === 'number' ? val : 0
                  const x = (index / (data.length - 1 || 1)) * 800
                  const y = 200 - ((value - minValue) / (maxValue - minValue || 1)) * 200
                  return `${x},${y}`
                })
                .join(' ') + ' 800,200 0,200'
            }
          />
        </svg>

        {/* 数值标注 */}
        <div className="absolute top-2 right-2 text-xs text-gray-500">
          最高: {formatValue(maxValue)}
        </div>
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          最低: {formatValue(minValue)}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-xs text-gray-500">最高</div>
          <div className="text-sm font-semibold text-gray-900">{formatValue(maxValue)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">最低</div>
          <div className="text-sm font-semibold text-gray-900">{formatValue(minValue)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">平均</div>
          <div className="text-sm font-semibold text-gray-900">
            {formatValue(
              data.reduce((sum, item) => {
                const val = item[dataKey]
                return sum + (typeof val === 'number' ? val : 0)
              }, 0) / (data.length || 1)
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
