'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'

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
      setError(err.message || '网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 计算涨跌额
  const changeAmount = stockData ? stockData.now - stockData.yesterday : 0
  const isUp = changeAmount > 0
  const isDown = changeAmount < 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📈 股票实时查询
          </h1>
          <p className="text-gray-600">
            输入股票代码，查看实时行情数据
          </p>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入股票代码，如：600519 或 SH600519"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={loading}
            />
            <Button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 text-lg"
            >
              {loading ? '查询中...' : '搜索'}
            </Button>
          </div>

          {/* 提示 */}
          <div className="mt-3 text-sm text-gray-500">
            <p>💡 支持格式：</p>
            <ul className="ml-6 mt-1 space-y-1">
              <li>• 仅数字：600519（自动识别交易所）</li>
              <li>• 带前缀：SH600519（沪市）、SZ000001（深市）</li>
            </ul>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">❌ {error}</p>
          </div>
        )}

        {/* 股票数据展示 */}
        {stockData && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 股票标题 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{stockData.name}</h2>
                  <p className="text-blue-100">{stockData.code}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-blue-100 mb-1">
                    数据来源: {stockData.source === 'netease' ? '网易财经' : '腾讯股票'}
                  </div>
                  <div className="text-xs text-blue-100">
                    更新时间: {new Date(stockData.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            </div>

            {/* 主要数据 */}
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* 当前价 */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">当前价</p>
                  <p className={`text-4xl font-bold ${
                    isUp ? 'text-red-500' : isDown ? 'text-green-500' : 'text-gray-900'
                  }`}>
                    ¥{stockData.now.toFixed(2)}
                  </p>
                </div>

                {/* 涨跌幅 */}
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">涨跌幅</p>
                  <div className={`text-3xl font-bold ${
                    isUp ? 'text-red-500' : isDown ? 'text-green-500' : 'text-gray-900'
                  }`}>
                    <div>{isUp ? '+' : ''}{changeAmount.toFixed(2)}</div>
                    <div className="text-2xl">
                      {isUp ? '+' : ''}{stockData.percent.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 详细数据 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">昨收</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ¥{stockData.yesterday.toFixed(2)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">最高</p>
                  <p className="text-lg font-semibold text-red-500">
                    ¥{stockData.high.toFixed(2)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">最低</p>
                  <p className="text-lg font-semibold text-green-500">
                    ¥{stockData.low.toFixed(2)}
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">振幅</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {((stockData.high - stockData.low) / stockData.yesterday * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 常用股票代码示例 */}
        {!stockData && !error && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">💡 常用股票代码</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { code: '600519', name: '贵州茅台' },
                { code: '000001', name: '平安银行' },
                { code: '000858', name: '五粮液' },
                { code: '600036', name: '招商银行' },
                { code: '000333', name: '美的集团' },
                { code: '601318', name: '中国平安' },
              ].map((stock) => (
                <button
                  key={stock.code}
                  onClick={() => {
                    setCode(stock.code)
                    setError('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-colors text-left"
                >
                  <div className="font-medium text-gray-900">{stock.name}</div>
                  <div className="text-sm text-gray-500">{stock.code}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
