'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { DailyMarketStats } from '@/types/market'

interface MarketTrendChartProps {
  title?: string
  showBoth?: boolean // 是否同时显示涨跌停
  data?: DailyMarketStats[]
  loading?: boolean
}

export function MarketTrendChart({
  title = '市场趋势',
  showBoth = false,
  data = [],
  loading = false,
}: MarketTrendChartProps) {
  const { options, stats } = useMemo(() => {
    if (data.length === 0) {
      return { options: {}, stats: null }
    }

    const dates = data.map((d) => {
      const date = d.statDate.split('-')
      return `${date[1]}/${date[2]}`
    })

    const limitUpData = data.map((d) => d.limitUpCount)
    const limitDownData = data.map((d) => d.limitDownCount)
    const maxLbData = data.map((d) => d.maxContinuousLimit)

    const options = showBoth
      ? {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
            axisPointer: { type: 'cross' },
          },
          legend: {
            data: ['涨停', '跌停'],
            top: 0,
            textStyle: { color: '#6b7280' },
          },
          grid: {
            left: '10%',
            right: '8%',
            top: '15%',
            bottom: '12%',
          },
          xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
          },
          series: [
            {
              name: '涨停',
              data: limitUpData,
              type: 'bar',
              barWidth: '30%',
              itemStyle: {
                color: '#ef4444',
                borderRadius: [4, 4, 0, 0],
              },
              emphasis: {
                itemStyle: { color: '#dc2626' },
              },
              animationDuration: 800,
            },
            {
              name: '跌停',
              data: limitDownData,
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 8,
              lineStyle: { width: 3, color: '#10b981' },
              itemStyle: { color: '#10b981' },
              emphasis: {
                scale: true,
              },
              animationDuration: 800,
            },
          ],
        }
      : {
          tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            textStyle: { color: '#374151' },
          },
          grid: {
            left: '12%',
            right: '8%',
            top: '18%',
            bottom: '15%',
          },
          xAxis: {
            type: 'category',
            data: dates,
            axisLine: { lineStyle: { color: '#e5e7eb' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
          },
          yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
            axisLabel: { color: '#6b7280', fontSize: 11 },
          },
          series: [
            {
              data: maxLbData,
              type: 'line',
              smooth: true,
              symbol: 'circle',
              symbolSize: 10,
              lineStyle: { width: 3, color: '#8b5cf6' },
              itemStyle: {
                color: '#8b5cf6',
                borderColor: '#fff',
                borderWidth: 2,
              },
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#8b5cf640' },
                    { offset: 1, color: '#8b5cf605' },
                  ],
                },
              },
              animationDuration: 1000,
            },
          ],
        }

    return {
      options,
      stats: {
        todayUp: limitUpData[limitUpData.length - 1] || 0,
        todayDown: limitDownData[limitDownData.length - 1] || 0,
        maxUp: Math.max(...limitUpData),
        maxDown: Math.max(...limitDownData),
        avgUp: Math.round(limitUpData.reduce((a, b) => a + b, 0) / limitUpData.length),
        todayLb: maxLbData[maxLbData.length - 1] || 0,
      },
    }
  }, [data, showBoth])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">⚠️ 暂无历史数据</p>
          <p className="text-yellow-600 text-xs mt-2">数据将从今天开始累积</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* 头部 */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">近 {data.length} 天</p>
        </div>
        {showBoth ? (
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-xs text-gray-400">今日涨跌</div>
              <div className="text-xl font-bold text-red-600">
                {stats?.todayUp}/{stats?.todayDown}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-xs text-gray-400">今日最高连板</div>
            <div className="text-xl font-bold text-purple-600">
              {stats?.todayLb}连板
            </div>
          </div>
        )}
      </div>

      {/* 图表 */}
      <div className="h-72">
        <ReactECharts
          option={options}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* 统计 */}
      {showBoth ? (
        <div className="mt-4 grid grid-cols-4 gap-4 text-center pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400">今日涨停</div>
            <div className="text-sm font-semibold text-red-600">{stats?.todayUp}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">今日跌停</div>
            <div className="text-sm font-semibold text-green-600">{stats?.todayDown}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">最高涨停</div>
            <div className="text-sm font-semibold text-gray-700">{stats?.maxUp}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">平均涨停</div>
            <div className="text-sm font-semibold text-gray-700">{stats?.avgUp}</div>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400">今日</div>
            <div className="text-sm font-semibold text-purple-600">{stats?.todayLb}连</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">最高</div>
            <div className="text-sm font-semibold text-gray-700">{Math.max(...data.map(d => d.maxContinuousLimit))}连</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">平均</div>
            <div className="text-sm font-semibold text-gray-700">
              {Math.round(data.reduce((s, d) => s + d.maxContinuousLimit, 0) / data.length)}连
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
