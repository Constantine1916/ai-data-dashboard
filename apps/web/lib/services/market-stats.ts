import { query } from '@/lib/db'
import type { DailyMarketStats, TopicRanking } from '@/types/market'
import { EastMoneyService } from './eastmoney'

/**
 * 市场统计数据服务
 */
export class MarketStatsService {
  /**
   * 保存每日市场统计数据
   */
  static async saveDailyStats(date: string, stats: Omit<DailyMarketStats, 'id' | 'createdAt' | 'updatedAt' | 'statDate'>) {
    const sql = `
      INSERT INTO daily_market_stats (
        stat_date, limit_up_count, limit_down_count, 
        total_volume, total_amount, max_continuous_limit
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (stat_date) 
      DO UPDATE SET
        limit_up_count = EXCLUDED.limit_up_count,
        limit_down_count = EXCLUDED.limit_down_count,
        total_volume = EXCLUDED.total_volume,
        total_amount = EXCLUDED.total_amount,
        max_continuous_limit = EXCLUDED.max_continuous_limit,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await query(sql, [
      date,
      stats.limitUpCount,
      stats.limitDownCount,
      stats.totalVolume,
      stats.totalAmount,
      stats.maxContinuousLimit,
    ])

    return this.mapDbToDailyStats(result[0])
  }

  /**
   * 保存题材涨幅数据
   */
  static async saveTopicRankings(date: string, topics: Array<{ code: string; name: string; changePercent: number; closePrice?: number }>) {
    // 先删除当天的旧数据
    await query('DELETE FROM topic_rankings WHERE stat_date = $1', [date])

    // 批量插入
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i]
      await query(
        `INSERT INTO topic_rankings (stat_date, topic_code, topic_name, change_percent, close_price, rank)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [date, topic.code, topic.name, topic.changePercent, topic.closePrice || null, i + 1]
      )
    }
  }

  /**
   * 获取近N天的市场统计数据
   */
  static async getRecentStats(days = 30): Promise<DailyMarketStats[]> {
    const sql = `
      SELECT * FROM daily_market_stats
      WHERE stat_date >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY stat_date DESC
    `

    const result = await query(sql)
    return result.map(this.mapDbToDailyStats)
  }

  /**
   * 获取今日市场统计数据
   */
  static async getTodayStats(): Promise<DailyMarketStats | null> {
    const sql = `
      SELECT * FROM daily_market_stats
      WHERE stat_date = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 1
    `

    const result = await query(sql)
    return result.length > 0 ? this.mapDbToDailyStats(result[0]) : null
  }

  /**
   * 获取一周内题材涨幅（按近7天累计涨幅排序）
   */
  static async getWeeklyTopicRankings(limit = 20): Promise<TopicRanking[]> {
    const sql = `
      SELECT 
        topic_code,
        topic_name,
        MAX(stat_date) as stat_date,
        SUM(change_percent) as change_percent,
        AVG(close_price) as close_price
      FROM topic_rankings
      WHERE stat_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY topic_code, topic_name
      ORDER BY SUM(change_percent) DESC
      LIMIT $1
    `

    const result = await query(sql, [limit])
    return result.map((row: any) => ({
      id: row.topic_code,
      statDate: row.stat_date,
      topicCode: row.topic_code,
      topicName: row.topic_name,
      changePercent: parseFloat(row.change_percent),
      closePrice: row.close_price ? parseFloat(row.close_price) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))
  }

  /**
   * 删除超过30天的旧数据
   */
  static async cleanOldData() {
    await query(`DELETE FROM daily_market_stats WHERE stat_date < CURRENT_DATE - INTERVAL '30 days'`)
    await query(`DELETE FROM topic_rankings WHERE stat_date < CURRENT_DATE - INTERVAL '30 days'`)
  }

  /**
   * 执行每日数据收集任务
   */
  static async runDailyCollection() {
    const today = new Date().toISOString().split('T')[0]

    console.log(`[MarketStats] 开始收集 ${today} 的市场数据...`)

    try {
      // 1. 收集市场统计数据
      const stats = await EastMoneyService.collectTodayStats()
      await this.saveDailyStats(today, stats)
      console.log(`[MarketStats] 市场统计数据已保存:`, stats)

      // 2. 收集题材涨幅数据
      const topics = await EastMoneyService.getTopicRankings(50)
      await this.saveTopicRankings(
        today,
        topics.map((t) => ({
          code: t.f12,
          name: t.f14,
          changePercent: t.f3,
          closePrice: t.f2,
        }))
      )
      console.log(`[MarketStats] 题材涨幅数据已保存: ${topics.length} 条`)

      // 3. 清理旧数据
      await this.cleanOldData()
      console.log(`[MarketStats] 已清理30天前的旧数据`)

      return { success: true, date: today, stats }
    } catch (error) {
      console.error(`[MarketStats] 数据收集失败:`, error)
      throw error
    }
  }

  /**
   * 数据库行映射为 TypeScript 对象
   */
  private static mapDbToDailyStats(row: any): DailyMarketStats {
    return {
      id: row.id,
      statDate: row.stat_date,
      limitUpCount: row.limit_up_count,
      limitDownCount: row.limit_down_count,
      totalVolume: parseInt(row.total_volume),
      totalAmount: parseFloat(row.total_amount),
      maxContinuousLimit: row.max_continuous_limit,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }
}
