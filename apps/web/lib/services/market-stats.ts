import { query } from '@/lib/db'
import { supabase } from '@/lib/db/supabase'
import type { DailyMarketStats, TopicRanking } from '@/types/market'
import { TencentService } from './tencent'
import { getLatestTradingDay, isTradingDay } from './trading-day'

// 优先使用 Supabase 客户端
const useSupabase = !!process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * 市场统计数据服务
 */
export class MarketStatsService {
  /**
   * 保存每日市场统计数据
   */
  static async saveDailyStats(date: string, stats: Omit<DailyMarketStats, 'id' | 'createdAt' | 'updatedAt' | 'statDate'>) {
    if (useSupabase) {
      // 使用 Supabase upsert
      // 注意：确保 BIGINT 类型正确传递（转为字符串）
      const { data, error } = await supabase
        .from('daily_market_stats')
        .upsert({
          stat_date: date,
          limit_up_count: stats.limitUpCount,
          limit_down_count: stats.limitDownCount,
          total_volume: String(stats.totalVolume), // BIGINT 需要字符串
          total_amount: String(stats.totalAmount), // DECIMAL 也转字符串保持精度
          max_continuous_limit: stats.maxContinuousLimit,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'stat_date'
        })
        .select()
        .single()
      
      if (error) throw error
      return this.mapDbToDailyStats(data)
    } else {
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
  }

  /**
   * 保存题材涨幅数据
   */
  static async saveTopicRankings(date: string, topics: Array<{ code: string; name: string; changePercent: number; closePrice?: number }>) {
    if (useSupabase) {
      // 先删除当天的旧数据
      await supabase.from('topic_rankings').delete().eq('stat_date', date)

      // 批量插入
      const rows = topics.map((topic, i) => ({
        stat_date: date,
        topic_code: topic.code,
        topic_name: topic.name,
        change_percent: topic.changePercent,
        close_price: topic.closePrice || null,
        rank: i + 1,
      }))
      
      const { error } = await supabase.from('topic_rankings').insert(rows)
      if (error) throw error
    } else {
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
  }

  /**
   * 获取近N天的市场统计数据
   */
  static async getRecentStats(days = 30): Promise<DailyMarketStats[]> {
    if (useSupabase) {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - days)
      
      const { data, error } = await supabase
        .from('daily_market_stats')
        .select('*')
        .gte('stat_date', dateFrom.toISOString().split('T')[0])
        .order('stat_date', { ascending: false })
      
      if (error) throw error
      return (data || []).map(this.mapDbToDailyStats)
    } else {
      const sql = `
        SELECT * FROM daily_market_stats
        WHERE stat_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY stat_date DESC
      `

      const result = await query(sql)
      return result.map(this.mapDbToDailyStats)
    }
  }

  /**
   * 获取今日市场统计数据
   * 始终判断是否为交易日期：
   * - 交易日：显示今日数据
   * - 非交易日：显示最后一个交易日的数据
   */
  static async getTodayStats(): Promise<(DailyMarketStats & { isFallback?: boolean; tradingDate?: string }) | null> {
    // 使用北京时间 (UTC+8) 获取今天日期
    const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0]

    // 先判断今天是否为交易日
    const todayIsTrading = await isTradingDay(today)
    
    if (!todayIsTrading) {
      // 今日非交易日，获取最近一个交易日
      const latestDate = await getLatestTradingDay()
      return this.getStatsByDate(latestDate, true)
    }

    // 今天是交易日，获取今日数据
    return this.getStatsByDate(today, false)
  }

  /**
   * 根据日期获取统计数据
   */
  private static async getStatsByDate(date: string, isFallback: boolean): Promise<(DailyMarketStats & { isFallback?: boolean; tradingDate?: string }) | null> {
    if (useSupabase) {
      const { data, error } = await supabase
        .from('daily_market_stats')
        .select('*')
        .eq('stat_date', date)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      
      if (data) {
        return {
          ...this.mapDbToDailyStats(data),
          isFallback,
          tradingDate: date
        }
      }
      
      // 该日期无数据，递归获取更早的交易日
      if (!isFallback) {
        const latestDate = await getLatestTradingDay()
        return this.getStatsByDate(latestDate, true)
      }
      
      return null
    } else {
      // PostgreSQL 版本
      const sql = `
        SELECT * FROM daily_market_stats
        WHERE stat_date = $1
        ORDER BY created_at DESC
        LIMIT 1
      `

      const result = await query(sql, [date])
      
      if (result.length > 0) {
        return {
          ...this.mapDbToDailyStats(result[0]),
          isFallback,
          tradingDate: date
        }
      }
      
      // 该日期无数据
      if (!isFallback) {
        const latestDate = await getLatestTradingDay()
        return this.getStatsByDate(latestDate, true)
      }
      
      return null
    }
  }

  /**
   * 获取一周内题材涨幅（按近7天累计涨幅排序）
   */
  static async getWeeklyTopicRankings(limit = 20): Promise<TopicRanking[]> {
    if (useSupabase) {
      // Supabase 不支持复杂的 GROUP BY，所以先获取数据再在内存中聚合
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - 7)
      
      const { data, error } = await supabase
        .from('topic_rankings')
        .select('*')
        .gte('stat_date', dateFrom.toISOString().split('T')[0])
      
      if (error) throw error
      
      // 在内存中按 topic_code 聚合
      const aggregated = new Map<string, { name: string; totalChange: number; avgPrice: number; count: number; lastDate: string }>()
      
      for (const row of data || []) {
        const key = row.topic_code
        const existing = aggregated.get(key)
        if (existing) {
          existing.totalChange += row.change_percent
          existing.avgPrice += row.close_price || 0
          existing.count++
          if (row.stat_date > existing.lastDate) {
            existing.lastDate = row.stat_date
          }
        } else {
          aggregated.set(key, {
            name: row.topic_name,
            totalChange: row.change_percent,
            avgPrice: row.close_price || 0,
            count: 1,
            lastDate: row.stat_date,
          })
        }
      }
      
      // 转换为数组并排序
      return Array.from(aggregated.entries())
        .map(([code, agg]) => ({
          id: code,
          statDate: agg.lastDate,
          topicCode: code,
          topicName: agg.name,
          changePercent: agg.totalChange,
          closePrice: agg.count > 0 ? agg.avgPrice / agg.count : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }))
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit)
    } else {
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
  }

  /**
   * 删除超过30天的旧数据
   */
  static async cleanOldData() {
    const dateBefore = new Date()
    dateBefore.setDate(dateBefore.getDate() - 30)
    const dateStr = dateBefore.toISOString().split('T')[0]
    
    if (useSupabase) {
      await supabase.from('daily_market_stats').delete().lt('stat_date', dateStr)
      await supabase.from('topic_rankings').delete().lt('stat_date', dateStr)
    } else {
      await query(`DELETE FROM daily_market_stats WHERE stat_date < CURRENT_DATE - INTERVAL '30 days'`)
      await query(`DELETE FROM topic_rankings WHERE stat_date < CURRENT_DATE - INTERVAL '30 days'`)
    }
  }

  /**
   * 执行每日数据收集任务
   * Vercel Serverless 最大执行时间有限制，需要优化超时
   */
  static async runDailyCollection() {
    const today = new Date().toISOString().split('T')[0]

    console.log(`[MarketStats] 开始收集 ${today} 的市场数据...`)

    try {
      // 1. 收集市场统计数据（带超时控制）
      const statsPromise = TencentService.collectTodayStats()
      const statsTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('收集市场数据超时（45秒）')), 45000)
      )
      const stats = await Promise.race([statsPromise, statsTimeoutPromise]) as any
      await this.saveDailyStats(today, stats)
      console.log(`[MarketStats] 市场统计数据已保存:`, stats)

      // 2. 清理旧数据（异步，不阻塞主流程）
      this.cleanOldData().catch(err => console.warn('[MarketStats] 清理旧数据失败:', err.message))

      return { success: true, date: today, stats }
    } catch (error: any) {
      console.error(`[MarketStats] 数据收集失败:`, error)
      throw new Error(`数据收集失败: ${error.message}`)
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
