'use client'

import { useState, useEffect } from 'react'
import type { DailyMarketStats } from '@/types/market'

interface MarketOverviewProps {
  todayStats?: DailyMarketStats | null
}

export function MarketOverview({ todayStats: initialStats }: MarketOverviewProps) {
  const [stats, setStats] = useState<DailyMarketStats | null>(initialStats || null)
  const [loading, setLoading] = useState(!initialStats)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialStats) {
      fetchTodayStats()
    }
  }, [initialStats])

  const fetchTodayStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats/today')
      const data = await res.json()

      if (data.success) {
        setStats(data.data)
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600">❌ {error}</p>
        <button
          onClick={fetchTodayStats}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          重试
        </button>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">⚠️ 今日数据尚未收集</p>
        <p className="text-sm text-yellow-600 mt-2">
          数据将在每天 15:30 后自动更新
        </p>
      </div>
    )
  }

  const cards = [
    {
      title: '涨停家数',
      value: stats.limitUpCount,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      icon: '📈',
    },
    {
      title: '跌停家数',
      value: stats.limitDownCount,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      icon: '📉',
    },
    {
      title: '最高连板',
      value: `${stats.maxContinuousLimit}连`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: '🔥',
    },
    {
      title: '市场成交额',
      value: `${(stats.totalAmount / 100000000).toFixed(0)}亿`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: '💰',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">今日市场概览</h2>
        <span className="text-sm text-gray-500">{stats.statDate}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-gray-500">{card.title}</span>
            </div>
            <div className={`text-3xl font-bold ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
