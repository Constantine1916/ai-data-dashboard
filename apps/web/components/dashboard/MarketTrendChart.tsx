'use client'

import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { DailyMarketStats } from '@/types/market'

interface MarketTrendChartProps {
  title: string
  dataKey: 'limitUpCount' | 'limitDownCount' | 'maxContinuousLimit' | 'totalAmount'
  color?: string
  data?: DailyMarketStats[]
  loading?: boolean
}

export function MarketTrendChart({
  title,
  dataKey,
  color = '#3b82f6',
  data = [],
  loading = false,
}: MarketTrendChartProps) {
  // 格式化数据
  const { options, latestValue, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) {
      return {
        options: {},
        latestValue: 0,
        maxValue: 0,
        minValue: 0,
      }
    }

    const dates = data.map((d) => {
      const date = d.statDate.split('-')
      return `${date[1]}/${date[2]}`
    })

    const values = data.map((d) => {
      const val = d[dataKey]
      return typeof val === 'number' ? val : 0
    })

    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)
    const latest = values[values.length - 1]

    // 格式化数值
    const formatValue = (v: number) => {
      if (dataKey === 'totalAmount') {
        if (v >= 1e12) return `${(v / 1e12).toFixed(1)}万亿`
        if (v >= 1e11) return `${(v / 1e11).toFixed(1)}千亿`
        if (v >= 1e10) return `${(v / 1e10).toFixed(1)}百亿`
        if (v >= 1e9) return `${(v / 1e9).toFixed(1)}十亿`
        if (v >= 1e8) return `${(v / 1e8).toFixed(0)}亿`
        return `${(v / 1e6).toFixed(0)}万`
      }
      if (dataKey === 'maxContinuousLimit') {
        return `${v}连`
      }
      return v
    }

    const options = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: {
          color: '#374151',
        },
        formatter: (params: any) => {
          const item = params[0]
          return `
            <div style="padding: 4px 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
              <div style="color: ${color}; font-size: 16px; font-weight: bold;">
                ${formatValue(item.value)}
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
        axisLine: {
          lineStyle: { color: '#e5e7eb' },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed',
          },
        },
        axisLabel: {
          color: '#6b7280',
          fontSize: 11,
          formatter: (v: number) => {
            if (dataKey === 'totalAmount') {
              if (v >= 1e11) return `${(v / 1e11).toFixed(0)}`
              if (v >= 1e8) return `${(v / 1e8).toFixed(0)}`
              return v
            }
            return v
          },
        },
      },
      series: [
        {
          data: values,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: color,
          },
          itemStyle: {
            color: color,
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
                { offset: 0, color: color + '40' },
                { offset: 1, color: color + '05' },
              ],
            },
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: color + '40',
            },
          },
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
    }

    return { options, latestValue: latest, maxValue: maxVal, minValue: minVal }
  }, [data, dataKey, color])

  // 格式化显示
  const displayValue = (v: number) => {
    if (dataKey === 'totalAmount') {
      if (v >= 1e12) return `${(v / 1e12).toFixed(2)}万亿`
      if (v >= 1e11) return `${(v / 1e11).toFixed(1)}千亿`
      if (v >= 1e10) return `${(v / 1e10).toFixed(1)}百亿`
      if (v >= 1e9) return `${(v / 1e9).toFixed(1)}十亿`
      if (v >= 1e8) return `${(v / 1e8).toFixed(0)}亿`
      return `${(v / 1e6).toFixed(0)}万`
    }
    if (dataKey === 'maxContinuousLimit') {
      return `${v}连`
    }
    return v
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">⚠️ 暂无历史数据</p>
          <p className="text-yellow-600 text-xs mt-2">
            数据将从今天开始累积，7天后将显示完整趋势图
          </p>
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
          <p className="text-sm text-gray-500 mt-1">近 {data.length} 天趋势</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color }}>
            {displayValue(latestValue)}
          </div>
          <div className="text-xs text-gray-400">最新</div>
        </div>
      </div>

      {/* ECharts 图表 */}
      <div className="h-72">
        <ReactECharts
          option={options}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* 统计信息 */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center pt-4 border-t border-gray-100">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">最高</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            {displayValue(maxValue)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">最低</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            {displayValue(minValue)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">平均</div>
          <div className="text-sm font-semibold text-gray-700 mt-1">
            {displayValue(
              Math.round(
                data.reduce((sum, item) => {
                  const val = item[dataKey]
                  return sum + (typeof val === 'number' ? val : 0)
                }, 0) / data.length
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
