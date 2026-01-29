'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { MarketOverview } from '@/components/dashboard/MarketOverview'
import { MarketTrendChart } from '@/components/dashboard/MarketTrendChart'
import { TopicRankings } from '@/components/dashboard/TopicRankings'

function DashboardContent() {
  const { user, logout } = useAuth()

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

          {/* 市场概览卡片 */}
          <div className="mb-6">
            <MarketOverview />
          </div>

          {/* 趋势图 - 2列布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MarketTrendChart
              title="涨停数量趋势"
              dataKey="limitUpCount"
              color="#ef4444"
            />
            <MarketTrendChart
              title="市场成交额趋势"
              dataKey="totalAmount"
              color="#3b82f6"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <MarketTrendChart
              title="最高连板趋势"
              dataKey="maxContinuousLimit"
              color="#8b5cf6"
            />
            <MarketTrendChart
              title="跌停数量趋势"
              dataKey="limitDownCount"
              color="#10b981"
            />
          </div>

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
