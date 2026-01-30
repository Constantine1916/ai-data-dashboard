import type { EastMoneyResponse, EastMoneyStock, EastMoneyTopic } from '@/types/market'

const BASE_URL = 'https://push2.eastmoney.com/api/qt'

/**
 * 东方财富API服务
 */
export class EastMoneyService {
  /**
   * 获取股票列表（支持分页获取全部）
   * @param page 页码
   * @param size 每页数量
   * @param sortBy 排序字段 (f3=涨跌幅)
   * @param order 排序方向 (1=升序, 0=降序)
   */
  static async getStockList(
    page = 1,
    size = 500,
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
   * 获取所有A股股票（分页获取全部）
   */
  static async getAllStocks(): Promise<EastMoneyStock[]> {
    const pageSize = 500
    const allStocks: EastMoneyStock[] = []
    
    // 先获取第一页，获取总数
    const firstPage = await this.getStockList(1, pageSize, 'f3', 1)
    allStocks.push(...firstPage)
    
    // 计算总页数（A股约5500只，按500/页需要12页）
    const totalPages = Math.ceil(5600 / pageSize)
    
    // 并发获取剩余页（限制并发数避免被限流）
    const batchSize = 3  // 每次并发3个请求
    for (let i = 2; i <= totalPages; i += batchSize) {
      const batch = []
      for (let j = 0; j < batchSize && (i + j) <= totalPages; j++) {
        batch.push(this.getStockList(i + j, pageSize, 'f3', 1))
      }
      
      const results = await Promise.all(batch)
      results.forEach(stocks => {
        if (stocks.length > 0) {
          allStocks.push(...stocks)
        }
      })
      
      // 避免请求过快，稍微延迟
      if (i + batchSize <= totalPages) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`[EastMoney] 共获取 ${allStocks.length} 只股票`)
    return allStocks
  }

  /**
   * 获取涨停股票列表（非ST）
   */
  static async getLimitUpStocks(): Promise<EastMoneyStock[]> {
    const stocks = await this.getAllStocks()

    // 过滤涨停股票（涨幅 >= 9.9%，排除ST）
    const limitUpStocks = stocks.filter(
      (stock) =>
        stock.f3 >= 9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N') // 排除新股
    )
    
    console.log(`[EastMoney] 涨停股票: ${limitUpStocks.length} 只`)
    return limitUpStocks
  }

  /**
   * 获取跌停股票列表（非ST）
   */
  static async getLimitDownStocks(): Promise<EastMoneyStock[]> {
    const stocks = await this.getAllStocks()

    // 过滤跌停股票（涨幅 <= -9.9%，排除ST）
    const limitDownStocks = stocks.filter(
      (stock) =>
        stock.f3 <= -9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N')
    )
    
    console.log(`[EastMoney] 跌停股票: ${limitDownStocks.length} 只`)
    return limitDownStocks
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
    console.log(`[EastMoney] 最高连板: ${maxLimit} 天`)
    return maxLimit
  }

  /**
   * 获取市场总成交量和成交额
   */
  static async getMarketVolume(): Promise<{ volume: number; amount: number }> {
    const stocks = await this.getAllStocks()

    const volume = stocks.reduce((sum, stock) => sum + (stock.f5 || 0), 0)
    const amount = stocks.reduce((sum, stock) => sum + (stock.f6 || 0), 0)

    console.log(`[EastMoney] 总成交量: ${volume}, 总成交额: ${amount}`)
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
   * 优化：只获取一次全部股票，避免重复请求
   */
  static async collectTodayStats() {
    console.log('[EastMoney] 开始采集市场数据...')
    
    // 一次性获取所有股票
    const allStocks = await this.getAllStocks()
    
    // 过滤涨停
    const limitUpStocks = allStocks.filter(
      (stock) =>
        stock.f3 >= 9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N')
    )
    
    // 过滤跌停
    const limitDownStocks = allStocks.filter(
      (stock) =>
        stock.f3 <= -9.9 &&
        !stock.f14.includes('ST') &&
        !stock.f14.includes('*') &&
        !stock.f14.startsWith('N')
    )
    
    // 计算最高连板
    const validLimits = limitUpStocks
      .map((stock) => stock.f62 || 0)
      .filter((v) => v >= 0 && v <= 50)
    const maxLimit = validLimits.length > 0 ? Math.max(...validLimits) : 0
    
    // 计算总成交量/额
    const totalVolume = allStocks.reduce((sum, stock) => sum + (stock.f5 || 0), 0)
    const totalAmount = allStocks.reduce((sum, stock) => sum + (stock.f6 || 0), 0)
    
    const result = {
      limitUpCount: limitUpStocks.length,
      limitDownCount: limitDownStocks.length,
      totalVolume,
      totalAmount,
      maxContinuousLimit: maxLimit,
    }
    
    console.log('[EastMoney] 采集完成:', result)
    return result
  }
}
