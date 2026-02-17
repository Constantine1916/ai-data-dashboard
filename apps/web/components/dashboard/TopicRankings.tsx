'use client'

import { useState, useEffect } from 'react'
import type { TopicRanking } from '@/types/market'

export function TopicRankings() {
  const [topics, setTopics] = useState<TopicRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')

  // 初始化：获取最近有数据的交易日
  useEffect(() => {
    const initDate = async () => {
      try {
        // 从 today API 获取最近交易日
        const res = await fetch('/api/stats/today')
        const data = await res.json()
        
        if (data.success && data.data?.tradingDate) {
          setSelectedDate(data.data.tradingDate)
        } else {
          // Fallback: 使用今天
          const today = new Date()
          const yyyy = today.getFullYear()
          const mm = String(today.getMonth() + 1).padStart(2, '0')
          const dd = String(today.getDate()).padStart(2, '0')
          setSelectedDate(`${yyyy}-${mm}-${dd}`)
        }
      } catch (err) {
        // Fallback
        const today = new Date()
        const yyyy = today.getFullYear()
        const mm = String(today.getMonth() + 1).padStart(2, '0')
        const dd = String(today.getDate()).padStart(2, '0')
        setSelectedDate(`${yyyy}-${mm}-${dd}`)
      }
    }
    initDate()
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchTopics(selectedDate)
    }
  }, [selectedDate])

  const fetchTopics = async (date: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/stats/topics?date=${date}`)
      const data = await res.json()

      if (data.success) {
        if (data.data && data.data.length > 0) {
          setTopics(data.data)
        } else {
          // 该日期无数据，尝试找前一个交易日
          const prevDate = await findPreviousTradingDate(date)
          if (prevDate && prevDate !== date) {
            setSelectedDate(prevDate)
            // 不要在这里setLoading(false)，让useEffect重新触发
            return
          }
          setTopics([])
          setError('暂无数据')
        }
      } else {
        setError(data.error?.message || '获取数据失败')
      }
    } catch (err: any) {
      setError(err.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 找前一个交易日
  const findPreviousTradingDate = async (fromDate: string): Promise<string | null> => {
    const date = new Date(fromDate)
    for (let i = 1; i <= 10; i++) {
      date.setDate(date.getDate() - 1)
      // 跳过周末
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const checkDate = `${yyyy}-${mm}-${dd}`
      
      // 检查这天是否有数据且不是周末
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const res = await fetch(`/api/stats/topics?date=${checkDate}`)
      const data = await res.json()
      // 如果成功且有数据，或者返回"非交易日"错误，继续往前找
      if (data.success && data.data && data.data.length > 0) {
        return checkDate
      }
    }
    return null
  }

  // 生成可选日期（今天及之前）
  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()
    
    // 最多显示最近30天
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      
      // 跳过周末
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      dates.push(`${yyyy}-${mm}-${dd}`)
    }
    return dates
  }

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr)
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekDay = weekDays[date.getDay()]
    const mmdd = `${date.getMonth() + 1}/${date.getDate()}`
    return `${mmdd} ${weekDay}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse flex-shrink-0"></div>
        <div className="space-y-2 overflow-y-auto max-h-[320px] pr-2 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">📈 题材涨幅 TOP10</h3>
        
        {/* 日期选择器 */}
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {getAvailableDates().map((date) => (
            <option key={date} value={date}>
              {formatDateDisplay(date)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1 flex items-center justify-center">
          <p className="text-yellow-800 text-sm">⚠️ {error}</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1 flex items-center justify-center">
          <p className="text-yellow-800 text-sm">⚠️ 暂无数据</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar flex-1">
          {topics.map((topic, index) => {
            const isPositive = topic.changePercent >= 0
            const percentColor = isPositive ? 'text-red-600' : 'text-green-600'
            const bgColor = isPositive ? 'bg-red-50' : 'bg-green-50'

            return (
              <div
                key={topic.topicCode || index}
                className={`flex items-center justify-between p-3 rounded-lg ${bgColor} hover:shadow-sm transition-shadow flex-shrink-0`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`
                      flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                      ${index < 3 ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-600'}
                    `}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{topic.topicName}</div>
                    <div className="text-xs text-gray-500">{topic.topicCode || ''}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${percentColor}`}>
                    {isPositive ? '+' : ''}
                    {topic.changePercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
}
