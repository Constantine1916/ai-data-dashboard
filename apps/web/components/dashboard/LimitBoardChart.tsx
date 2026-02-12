'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { DailyMarketStats } from '@/types/market'

interface LimitBoardChartProps {
  data?: DailyMarketStats[]
  loading?: boolean
}

export function LimitBoardChart({ data = [], loading = false }: LimitBoardChartProps) {
  const { options, stats } = useMemo(() => {
    if (data.length === 0) {
      return { options: {}, stats: null }
    }

    const dates = data.map((d) => {
      const date = d.statDate.split('-')
      return `${date[1]}/${date[2]}`
    })

    const maxLb = data.map((d) => d.maxContinuousLimit)

    const maxVal = Math.max(...maxLb)
    const avgVal = maxLb.reduce((a, b) => a + b, 0) / maxLb.length

    const options = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        formatter: (params: any) => {
          const item = params[0]
          return `
            <div style="padding: 8px 12px;">
              <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${item.name}</div>
              <div style="color: #8b5cf6; font-size: 16px; font-weight: bold;">
                ${item.value}连板
              </div>
            </div>
          `
        },
      },
      grid: {
        left: '12%',
        right: '8%',
        top: '15%',
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
        name: '连板数',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      series: [
        {
          data: maxLb,
          type: 'line',
          smooth: true,
          symbol: 'diamond',
          symbolSize: 12,
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
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: '#8b5cf640',
            },
          },
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
    }

    return {
      options,
      stats: { maxVal, avgVal, latest: maxLb[maxLb.length - 1] },
    }
  }, [data])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔥 连板高度</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">⚠️ 暂无数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">🔥 连板高度</h3>
          <p className="text-sm text-gray-500 mt-1">近 {data.length} 天最高连板</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-purple-600">{stats?.latest}连</div>
          <div className="text-xs text-gray-400">最新</div>
        </div>
      </div>

      <div className="h-64">
        <ReactECharts
          option={options}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400">最高</div>
          <div className="text-sm font-semibold text-purple-600">{stats?.maxVal}连</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">平均</div>
          <div className="text-sm font-semibold text-gray-700">{stats?.avgVal.toFixed(1)}连</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">今日</div>
          <div className="text-sm font-semibold text-gray-700">{stats?.latest}连</div>
        </div>
      </div>
    </div>
  )
}
