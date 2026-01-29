import type { EastMoneyResponse, EastMoneyStock, EastMoneyTopic } from '@/types/market'

const BASE_URL = 'https://push2.eastmoney.com/api/qt'

/**
 * 东方财富API服务
 */
export class EastMoneyService {
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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`东方财富API请求失败: ${response.status}`)
    }

    const data: EastMoneyResponse<EastMoneyStock> = await response.json()

    if (data.rc !== 0 || !data.data) {
      throw new Error('东方财富API返回数据异常')
    }

    return data.data.diff || []
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
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`东方财富API请求失败: ${response.status}`)
    }

    const data: EastMoneyResponse<EastMoneyTopic> = await response.json()

    if (data.rc !== 0 || !data.data) {
      throw new Error('东方财富API返回数据异常')
    }

    return data.data.diff || []
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
