'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { MarketIndices } from '@/components/dashboard/MarketIndices'
import { MarketTrendChart } from '@/components/dashboard/MarketTrendChart'
import { TopicRankings } from '@/components/dashboard/TopicRankings'
import { useState, useEffect } from 'react'
import type { DailyMarketStats } from '@/types/market'

function DashboardContent() {
  const { user, logout } = useAuth()
  const [historyData, setHistoryData] = useState<DailyMarketStats[]>([])
  const [loading, setLoading] = useState(true)

  // 只获取一次历史数据
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/stats/history?days=7')
        const data = await res.json()
        if (data.success) {
          // 按日期升序排列（用于图表）
          setHistoryData(data.data.reverse())
        }
      } catch (err) {
        console.error('获取历史数据失败:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* 头部 */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📊 A股数据看板</h1>
                <p className="text-sm text-gray-500 mt-1">
                  欢迎回来，{user?.name} · 数据每日 15:30 自动更新
                </p>
              </div>
              <Button onClick={logout} variant="outline">
                登出
              </Button>
            </div>
          </div>

          {/* 大A指数 */}
          <div className="mb-6">
            <MarketIndices />
          </div>

          {/* 市场概览卡片 */}
          <div className="mb-6">
            <MarketOverview />
          </div>

          {/* 趋势图 - 涨跌停对比 */}
          <div className="mb-6">
            <MarketTrendChart
              title="涨跌停对比"
              showBoth={true}
              data={historyData}
              loading={loading}
            />
          </div>

          {/* 连板趋势 */}
          <div className="mb-6">

          {/* 题材涨幅榜单 */}
          <div className="mb-6">
            <TopicRankings />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
