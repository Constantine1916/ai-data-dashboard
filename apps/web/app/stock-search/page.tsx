'use client'

import { useState } from 'react'

interface StockData {
  code: string
  name: string
  now: number
  yesterday: number
  percent: number
  high: number
  low: number
  source: string
  timestamp: string
}

export default function StockSearchPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!code.trim()) {
      setError('请输入股票代码')
      return
    }

    setLoading(true)
    setError('')
    setStockData(null)

    try {
      const response = await fetch(`/api/stock/search?code=${encodeURIComponent(code.trim())}`)
      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || '查询失败')
        return
      }

      setStockData(result.data)
    } catch (err: any) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const changeAmount = stockData ? stockData.now - stockData.yesterday : 0
  const isUp = changeAmount > 0
  const isDown = changeAmount < 0

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">股票查询</h1>
            <div className="text-sm text-gray-500">实时行情</div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 搜索区域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入股票代码，如 600519"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-base font-medium"
            >
              {loading ? '查询中' : '查询'}
            </button>
          </div>

          {/* 快捷代码 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { code: '600519', name: '贵州茅台' },
              { code: '000858', name: '五粮液' },
              { code: '600036', name: '招商银行' },
              { code: '000333', name: '美的集团' },
            ].map((stock) => (
              <button
                key={stock.code}
                onClick={() => {
                  setCode(stock.code)
                  setError('')
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                {stock.name} {stock.code}
              </button>
            ))}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* 股票数据展示 */}
        {stockData && (
          <div className="space-y-4">
            {/* 股票标题卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-900">{stockData.name}</h2>
                <span className="text-base text-gray-500">{stockData.code}</span>
              </div>

              {/* 价格和涨跌 */}
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-sm text-gray-500 mb-1">当前价</div>
                  <div className={`text-4xl font-bold ${
                    isUp ? 'text-red-600' : isDown ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {stockData.now.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">涨跌幅</div>
                  <div className={`text-3xl font-bold ${
                    isUp ? 'text-red-600' : isDown ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {isUp ? '+' : ''}{changeAmount.toFixed(2)} 
                    <span className="text-2xl ml-2">
                      {isUp ? '+' : ''}{stockData.percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 详细数据卡片 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="border-r border-gray-200 pr-6 last:border-r-0">
                  <div className="text-xs text-gray-500 mb-1">昨收</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stockData.yesterday.toFixed(2)}
                  </div>
                </div>

                <div className="border-r border-gray-200 pr-6 md:border-r-0 md:pr-0">
                  <div className="text-xs text-gray-500 mb-1">今开</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stockData.now.toFixed(2)}
                  </div>
                </div>

                <div className="border-r border-gray-200 pr-6 last:border-r-0">
                  <div className="text-xs text-gray-500 mb-1">最高</div>
                  <div className="text-lg font-semibold text-red-600">
                    {stockData.high.toFixed(2)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">最低</div>
                  <div className="text-lg font-semibold text-green-600">
                    {stockData.low.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* 数据来源 */}
            <div className="text-xs text-gray-400 text-center">
              数据来源：{stockData.source === 'netease' ? '网易财经' : '腾讯证券'} | 
              更新时间：{new Date(stockData.timestamp).toLocaleTimeString('zh-CN')}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!stockData && !error && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-2">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-gray-500">输入股票代码开始查询</p>
          </div>
        )}
      </div>
    </div>
  )
}
