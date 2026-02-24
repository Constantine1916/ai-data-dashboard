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
    
    const totalAmount = Math.round(parseFloat(lines[1]) || 0);
    const totalVolume = Math.round(parseFloat(lines[2]) || 0);
    
    return {
      limitUpCount: 0,  // 暂时无法获取
      limitDownCount: 0, // 暂时无法获取
      maxContinuousLimit: 0, // 暂时无法获取
      totalVolume: totalVolume,
      totalAmount: totalAmount,
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
    
    console.log('🎉 所有数据收集完成！');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

saveData();
