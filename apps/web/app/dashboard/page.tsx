'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { MarketIndices } from '@/components/dashboard/MarketIndices'
import { TopicRankings } from '@/components/dashboard/TopicRankings'
import { AmountChart } from '@/components/dashboard/AmountChart'
import { LimitUpDownChart } from '@/components/dashboard/LimitUpDownChart'
import { LimitBoardChart } from '@/components/dashboard/LimitBoardChart'
import { useState, useEffect } from 'react'
import type { DailyMarketStats } from '@/types/market'

function DashboardContent() {
  const { user, logout } = useAuth()
  const [historyData, setHistoryData] = useState<DailyMarketStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/stats/history?days=7')
        const data = await res.json()
        if (data.success) {
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

          {/* 第一行：成交额 + 题材榜 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AmountChart data={historyData} loading={loading} />
            <TopicRankings />
          </div>

          {/* 第二行：涨跌停对比 + 连板高度 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <LimitUpDownChart data={historyData} loading={loading} />
            <LimitBoardChart data={historyData} loading={loading} />
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
