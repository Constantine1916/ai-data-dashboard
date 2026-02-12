'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { DailyMarketStats } from '@/types/market'

interface MarketTrendChartProps {
  data?: DailyMarketStats[]
  loading?: boolean
}

export function MarketTrendChart({ data = [], loading = false }: MarketTrendChartProps) {
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

    const options = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#374151' },
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          let html = `<div style="padding: 8px 12px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #111827;">${params[0].axisValue}</div>`
          params.forEach((item: any) => {
            let color = item.color
            if (item.seriesName === '涨停') color = '#ef4444'
            else if (item.seriesName === '跌停') color = '#10b981'
            else if (item.seriesName === '最高连板') color = '#8b5cf6'
            html += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${color};"></span>
              <span style="color: #6b7280;">${item.seriesName}:</span>
              <span style="font-weight: 600; color: ${color};">${item.value}</span>
            </div>`
          })
          html += '</div>'
          return html
        },
      },
      legend: {
        data: ['涨停', '跌停', '最高连板'],
        top: 0,
        textStyle: { color: '#6b7280' },
      },
      grid: {
        left: '10%',
        right: '8%',
        top: '18%',
        bottom: '12%',
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { color: '#6b7280', fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          position: 'left',
          splitLine: { lineStyle: { color: '#f3f4f6', type: 'dashed' } },
          axisLabel: { color: '#6b7280', fontSize: 11 },
        },
        {
          type: 'value',
          name: '连板',
          position: 'right',
          splitLine: { show: false },
          axisLabel: { color: '#8b5cf6', fontSize: 11 },
        },
      ],
      series: [
        {
          name: '涨停',
          data: limitUpData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#ef4444' },
          itemStyle: { color: '#ef4444' },
          emphasis: { scale: true },
          animationDuration: 1000,
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
          emphasis: { scale: true },
          animationDuration: 1000,
        },
        {
          name: '最高连板',
          data: maxLbData,
          type: 'line',
          smooth: true,
          symbol: 'triangle',
          symbolSize: 10,
          lineStyle: { width: 3, color: '#8b5cf6' },
          itemStyle: { color: '#8b5cf6' },
          yAxisIndex: 1,
          emphasis: { scale: true },
          animationDuration: 1000,
        },
      ],
    }

    return {
      options,
      stats: {
        todayUp: limitUpData[limitUpData.length - 1] || 0,
        todayDown: limitDownData[limitDownData.length - 1] || 0,
        todayLb: maxLbData[maxLbData.length - 1] || 0,
        maxUp: Math.max(...limitUpData),
        maxDown: Math.max(...limitDownData),
        avgUp: Math.round(limitUpData.reduce((a, b) => a + b, 0) / limitUpData.length),
        maxLb: Math.max(...maxLbData),
      },
    }
  }, [data])

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 市场趋势</h3>
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
          <h3 className="text-lg font-semibold text-gray-900">📈 市场趋势</h3>
          <p className="text-sm text-gray-500 mt-1">近 {data.length} 天 · 双Y轴</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-xs text-gray-400">今日</div>
            <div className="text-xl font-bold text-red-600">{stats?.todayUp}/{stats?.todayDown}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">连板</div>
            <div className="text-xl font-bold text-purple-600">{stats?.todayLb}连</div>
          </div>
        </div>
      </div>

      {/* 图表 */}
      <div className="h-80">
        <ReactECharts
          option={options}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* 统计 */}
      <div className="mt-4 grid grid-cols-5 gap-4 text-center pt-4 border-t border-gray-100">
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
          <div className="text-xs text-gray-400">最高连板</div>
          <div className="text-sm font-semibold text-purple-600">{stats?.maxLb}连</div>
        </div>
        <div>
          <div className="text-xs text-gray-400">平均涨停</div>
          <div className="text-sm font-semibold text-gray-700">{stats?.avgUp}</div>
        </div>
      </div>
    </div>
  )
}
