/**
 * A股数据采集脚本
 * 使用 Akshare 接口获取市场数据
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ekbjjkcuqqskraubogzl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYmpqa2N1cXFza3JhdWJvZ3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM0NzMzNywiZXhwIjoyMDg0OTIzMzM3fQ.fgCOW2kyJHIQe2ombEW_GMoEWRukO_yix2-7zIktDQA'
);

// 动态判断是否为交易日
async function isTradingDay(date) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDay();
  if (day === 0 || day === 6) {
    console.log(`📅 今天是周末，不是交易日`);
    return false;
  }
  console.log(`📅 今天是工作日，是交易日`);
  return true;
}

/**
 * 使用 Python/Akshare 获取市场数据
 */
async function getMarketData() {
  console.log('正在通过 Akshare 获取市场数据...\n');
  
  const { execSync } = require('child_process');
  
  try {
    const output = execSync('python3 /root/clawd/ai-data-dashboard/get_market_data.py', {
      encoding: 'utf-8',
      timeout: 60000
    });
    
    console.log('Python 输出:', output);
    
    const lines = output.trim().split('\n');
    
    // 解析输出
    let totalAmount = 0;
    let totalVolume = 0;
    let limitUp = 0;
    let limitDown = 0;
    let maxContinuousLimit = 0;
    let topics = [];
    let inTopics = false;
    
    for (const line of lines) {
      if (line === 'TOPICS_START') {
        inTopics = true;
        continue;
      }
      if (line === 'TOPICS_END') {
        inTopics = false;
        continue;
      }
      
      if (inTopics) {
        const parts = line.split('|');
        if (parts.length >= 3) {
          topics.push({
            code: parts[0],
            name: parts[1],
            changePercent: parseFloat(parts[2]) || 0,
            closePrice: parts[3] ? parseFloat(parts[3]) : null
          });
        }
        continue;
      }
      
      if (line.startsWith('TOTAL_AMOUNT:')) {
        totalAmount = parseFloat(line.split(':')[1]) || 0;
      }
      if (line.startsWith('TOTAL_VOLUME:')) {
        totalVolume = parseFloat(line.split(':')[1]) || 0;
      }
      if (line.startsWith('LIMIT_UP:')) {
        limitUp = parseInt(line.split(':')[1]) || 0;
      }
      if (line.startsWith('LIMIT_DOWN:')) {
        limitDown = parseInt(line.split(':')[1]) || 0;
      }
      if (line.startsWith('MAX_CONTINUOUS_LIMIT:')) {
        maxContinuousLimit = parseInt(line.split(':')[1]) || 0;
      }
    }
    
    return {
      limitUpCount: limitUp,
      limitDownCount: limitDown,
      maxContinuousLimit: maxContinuousLimit,
      totalVolume: totalVolume,
      totalAmount: totalAmount,
      topics: topics
    };
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    throw error;
  }
}

async function saveData() {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 判断是否为交易日
    const isTodayTradingDay = await isTradingDay(today);
    if (!isTodayTradingDay) {
      console.log(`📅 ${todayStr} 不是交易日，跳过数据采集`);
      return;
    }
    
    console.log(`📅 今天是交易日: ${todayStr}\n`);
    
    const marketStats = await getMarketData();
    
    console.log('📊 市场数据:');
    console.log(`  总成交额: ${(marketStats.totalAmount / 100000000).toFixed(2)} 亿`);
    console.log(`  总成交量: ${(marketStats.totalVolume / 100000000).toFixed(2)} 亿手\n`);
    
    // 保存到数据库
    console.log('保存市场统计数据...');
    const { error: statsError } = await supabase
      .from('daily_market_stats')
      .upsert({
        stat_date: today,
        limit_up_count: marketStats.limitUpCount,
        limit_down_count: marketStats.limitDownCount,
        total_volume: marketStats.totalVolume,
        total_amount: marketStats.totalAmount,
        max_continuous_limit: marketStats.maxContinuousLimit,
      }, {
        onConflict: 'stat_date'
      });
    
    if (statsError) {
      console.error('❌ 市场统计保存失败:', statsError);
      throw statsError;
    }
    console.log('✅ 市场统计已保存\n');
    
    // 保存题材数据
    if (marketStats.topics && marketStats.topics.length > 0) {
      console.log('📈 保存题材数据...');
      
      // 先删除当天旧数据
      await supabase.from('topic_rankings').delete().eq('stat_date', todayStr);
      
      // 批量插入新数据
      const topicRows = marketStats.topics.map((t, i) => ({
        stat_date: todayStr,
        topic_code: t.code,
        topic_name: t.name,
        change_percent: t.changePercent,
        close_price: t.closePrice,
        rank: i + 1
      }));
      
      const { error: topicError } = await supabase.from('topic_rankings').insert(topicRows);
      
      if (topicError) {
        console.error('❌ 题材数据保存失败:', topicError);
      } else {
        console.log(`✅ 题材数据已保存 (${marketStats.topics.length} 条)\n`);
      }
    }
    
    console.log('🎉 所有数据收集完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

saveData();
