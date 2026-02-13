import type { EastMoneyResponse, EastMoneyStock, EastMoneyTopic } from '@/types/market'

const BASE_URL = 'https://push2.eastmoney.com/api/qt'
const TENCENT_BASE_URL = 'https://qt.gtimg.cn/q'
const TIMEOUT_MS = 30000 // 30秒超时

/**
 * 东方财富API服务
 */
export class EastMoneyService {
  /**
   * 带超时的 fetch
   */
  private static async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          ...options.headers,
        },
      })
      clearTimeout(timeoutId)
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      if (error.name === 'AbortError') {
        throw new Error(`请求超时（${TIMEOUT_MS/1000}秒）: ${url}`)
      }
      throw error
    }
  }

  /**
   * 带重试的请求
   */
  private static async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.fetchWithTimeout(url, options)
      } catch (error: any) {
        lastError = error
        console.warn(`[EastMoney] 第${attempt}次请求失败: ${error.message}`)
        
        // 如果是超时或网络错误，等待后重试
        if (attempt < maxRetries) {
          const waitTime = attempt * 2000 // 指数退避: 2s, 4s
          console.log(`[EastMoney] 等待${waitTime/1000}秒后重试...`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
        }
      }
    }
    
    throw lastError || new Error('请求失败')
  }

  /**
   * 获取股票列表
   * @param page 页码
   * @param size 每页数量
   * @param sortBy 排序字段 (f3=涨跌幅)
   * @param order 排序方向 (1=升序, 0=降序)
   */
  static async getStockList(
    page = 1,
    size = 5000,
    sortBy = 'f3',
    order: 0 | 1 = 1
  ): Promise<EastMoneyStock[]> {
    const params = new URLSearchParams({
      pn: String(page),
      pz: String(size),
      po: String(order),
      np: '1',
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fid: sortBy,
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23', // A股（不含创业板、科创板的ST）
      fields: 'f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18,f62',
    })

    const url = `${BASE_URL}/clist/get?${params}`
    
    try {
      const response = await this.fetchWithRetry(url)
      
      if (!response.ok) {
        throw new Error(`东方财富API请求失败: ${response.status} ${response.statusText}`)
      }

      const data: EastMoneyResponse<EastMoneyStock> = await response.json()

      if (data.rc !== 0 || !data.data) {
        throw new Error(`东方财富API返回数据异常: rc=${data.rc}`)
      }

      return data.data.diff || []
    } catch (error: any) {
      console.error('[EastMoney] 获取股票列表失败:', error.message)
      throw new Error(`获取股票数据失败: ${error.message}`)
    }
  }

  /**
   * 获取涨停股票列表（非ST）
   */
  static async getLimitUpStocks(): Promise<EastMoneyStock[]> {
    const stocks = await this.getStockList(1, 5000, 'f3', 1)

    // 过滤涨停股票（涨幅 >= 9.9%，排除ST）
    return stocks.filter(
      (stock) =>
        stock.f3 >= 9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N') // 排除新股
    )
  }

  /**
   * 获取跌停股票列表（非ST）
   */
  static async getLimitDownStocks(): Promise<EastMoneyStock[]> {
    const stocks = await this.getStockList(1, 5000, 'f3', 0) // 降序排列

    // 过滤跌停股票（涨幅 <= -9.9%，排除ST）
    return stocks.filter(
      (stock) =>
        stock.f3 <= -9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N')
    )
  }

  /**
   * 获取最高连板天数
   */
  static async getMaxContinuousLimit(): Promise<number> {
    const limitUpStocks = await this.getLimitUpStocks()

    if (limitUpStocks.length === 0) {
      return 0
    }

    // 找出连板天数最大值（过滤异常值，只取 0-50 范围）
    const validLimits = limitUpStocks
      .map((stock) => stock.f62 || 0)
      .filter((v) => v >= 0 && v <= 50)
    
    const maxLimit = validLimits.length > 0 ? Math.max(...validLimits) : 0
    return maxLimit
  }

  /**
   * 获取市场总成交量和成交额
   */
  static async getMarketVolume(): Promise<{ volume: number; amount: number }> {
    const stocks = await this.getStockList(1, 5000)

    const volume = stocks.reduce((sum, stock) => sum + (stock.f5 || 0), 0)
    const amount = stocks.reduce((sum, stock) => sum + (stock.f6 || 0), 0)

    return { volume, amount }
  }

  /**
   * 获取概念板块涨幅排名
   * @param limit 返回数量
   */
  static async getTopicRankings(limit = 50): Promise<EastMoneyTopic[]> {
    const params = new URLSearchParams({
      pn: '1',
      pz: String(limit),
      po: '1',
      np: '1',
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fid: 'f3',
      fs: 'm:90+t:3', // 概念板块
      fields: 'f12,f14,f2,f3',
    })

    const url = `${BASE_URL}/clist/get?${params}`
    
    try {
      const response = await this.fetchWithRetry(url)
      
      if (!response.ok) {
        throw new Error(`东方财富API请求失败: ${response.status} ${response.statusText}`)
      }

      const data: EastMoneyResponse<EastMoneyTopic> = await response.json()

      if (data.rc !== 0 || !data.data) {
        throw new Error(`东方财富API返回数据异常: rc=${data.rc}`)
      }

      return data.data.diff || []
    } catch (error: any) {
      console.error('[EastMoney] 获取题材排名失败:', error.message)
      throw new Error(`获取题材数据失败: ${error.message}`)
    }
  }

  /**
   * 解析腾讯股票数据
   * 格式: v_sh000001="1~上证指数~000001~4082.07~4134.02~4115.92~500799472~...~846808337~..."
   * 字段说明:
   *   3: 当前价
   *   4: 昨日收盘价
   *   6: 成交量(股)
   *   9: 成交额(万)
   */
  private static parseTencentStock(data: string, code: string) {
    try {
      const match = data.match(new RegExp(`${code}=([^;]+)`))
      if (!match) return null

      const parts = match[1].replace(/^"|"$/g, '').split('~')

      if (parts.length < 10) return null

      const now = parseFloat(parts[3]) || 0           // 当前价
      const yesterday = parseFloat(parts[4]) || 0      // 昨日收盘价
      const change = now - yesterday                    // 涨跌额
      const changePercent = yesterday > 0 ? (change / yesterday) * 100 : 0
      const volume = parseFloat(parts[6]) || 0        // 成交量(股)
      const amount = parseFloat(parts[9]) || 0        // 成交额(万) - 腾讯真实数据！

      return {
        price: now,
        change: change,
        changePercent: changePercent,
        volume: volume,
        amount: amount * 10000, // 转换为元
      }
    } catch {
      return null
    }
  }

  /**
   * 获取大A主要指数实时数据
   * 优先使用腾讯API（更稳定），备用东方财富API
   */
  static async getMarketIndices(): Promise<Array<{
    code: string
    name: string
    price: number
    change: number
    changePercent: number
    volume: number
    amount: number
  }>> {
    // 主要指数代码
    const indices = [
      { code: 'sh000001', name: '上证指数' },
      { code: 'sz399001', name: '深证成指' },
      { code: 'sz399006', name: '创业板指' },
      { code: 'sh000688', name: '科创50' },
      { code: 'sz399905', name: '中证500' },
      { code: 'sh000300', name: '沪深300' },
      { code: 'sz399852', name: '北证50' },
    ]

    // 使用腾讯API获取指数数据
    try {
      const codes = indices.map(i => i.code).join(',')
      const url = `${TENCENT_BASE_URL}=${codes}`
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.9',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const text = await response.text()
      const rows = text.split(';').map(r => r.trim()).filter(r => r)

      const results = indices.map((index, i) => {
        const data = rows[i] || ''
        const parsed = this.parseTencentStock(data, index.code)

        if (parsed) {
          return {
            code: index.code,
            name: index.name,
            price: parsed.price,
            change: parsed.change,
            changePercent: parsed.changePercent,
            volume: parsed.volume,
            amount: parsed.amount,
          }
        }

        // 如果腾讯API失败，返回0数据
        return {
          code: index.code,
          name: index.name,
          price: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          amount: 0,
        }
      })

      console.log(`[EastMoney] 使用腾讯API获取指数数据成功: ${results.filter(r => r.price > 0).length}/${results.length}`)
      return results
    } catch (error: any) {
      console.warn(`[EastMoney] 腾讯API失败，尝试东方财富API: ${error.message}`)

      // 备用：使用东方财富API
      const results = await Promise.all(
        indices.map(async (index) => {
          try {
            const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${index.code}&fields=f2,f3,f4,f5,f6,f8,f12,f14`
            const response = await this.fetchWithRetry(url)
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`)

            const data = await response.json()
            
            if (data.data) {
              return {
                code: index.code,
                name: index.name,
                price: data.data.f2 || 0,
                change: data.data.f4 || 0,
                changePercent: data.data.f3 || 0,
                volume: data.data.f5 || 0,
                amount: data.data.f6 || 0,
              }
            }
            throw new Error('No data')
          } catch (err: any) {
            console.warn(`[EastMoney] 获取 ${index.name} 失败: ${err.message}`)
            return {
              code: index.code,
              name: index.name,
              price: 0,
              change: 0,
              changePercent: 0,
              volume: 0,
              amount: 0,
            }
          }
        })
      )

      return results
    }
  }

  /**
   * 收集今日所有市场数据（用于定时任务）
   */
  static async collectTodayStats() {
    const [limitUpStocks, limitDownStocks, marketVolume, maxLimit] = await Promise.all([
      this.getLimitUpStocks(),
      this.getLimitDownStocks(),
      this.getMarketVolume(),
      this.getMaxContinuousLimit(),
    ])

    return {
      limitUpCount: limitUpStocks.length,
      limitDownCount: limitDownStocks.length,
      totalVolume: marketVolume.volume,
      totalAmount: marketVolume.amount,
      maxContinuousLimit: maxLimit,
    }
  }
}
