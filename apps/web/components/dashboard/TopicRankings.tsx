'use client'

import { useState, useEffect } from 'react'
import type { TopicRanking } from '@/types/market'

export function TopicRankings() {
  const [topics, setTopics] = useState<TopicRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/stats/topics/weekly?limit=20')
      const data = await res.json()

      if (data.success) {
        setTopics(data.data)
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse flex-shrink-0"></div>
        <div className="space-y-2 overflow-y-auto max-h-[320px] pr-2 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded animate-pulse flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex-shrink-0">📈 题材涨幅 TOP20</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4 flex-1">
          <p className="text-red-600 text-sm">❌ {error}</p>
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex-shrink-0">📈 题材涨幅 TOP20</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex-1">
          <p className="text-yellow-800 text-sm">⚠️ 暂无数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">📈 题材涨幅 TOP20</h3>
        <button
          onClick={fetchTopics}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 刷新
        </button>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar flex-1">
        {topics.map((topic, index) => {
          const isPositive = topic.changePercent >= 0
          const percentColor = isPositive ? 'text-red-600' : 'text-green-600'
          const bgColor = isPositive ? 'bg-red-50' : 'bg-green-50'

          return (
            <div
              key={topic.topicCode}
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
                  <div className="text-xs text-gray-500">{topic.topicCode}</div>
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
