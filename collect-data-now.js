/**
 * A股数据采集脚本
 * 使用 Akshare 接口获取市场数据
 * 支持失败重试和17:00补采
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量必须设置');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// 最大重试次数
const MAX_RETRIES = 3;
// 重试间隔（毫秒）= 1分钟
const RETRY_DELAY = 60000;
// 17:00 北京时间补采时间
const SUPPLEMENTARY_HOUR = 17;
const SUPPLEMENTARY_MINUTE = 0;

let isSupplementaryRun = false;

/**
 * 等待指定时间
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 获取当前北京时间
 */
function getBeijingTime() {
  const now = new Date();
  // 北京时间 = UTC + 8
  const beijingOffset = 8 * 60 * 60 * 1000;
  return new Date(now.getTime() + beijingOffset);
}

/**
 * 是否应该运行补采（17:00）
 */
function shouldRunSupplementary() {
  const bt = getBeijingTime();
  return bt.getHours() === SUPPLEMENTARY_HOUR && bt.getMinutes() < 30;
}

/**
 * 是否可以重试
 */
function canRetry(retryCount) {
  return retryCount < MAX_RETRIES;
}

/**
 * 动态判断是否为交易日
 */
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
      timeout: 120000  // 2分钟超时
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
    let dataValid = false;
    
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
    
    // 检查数据是否有效（成交额和成交量不为0）
    dataValid = totalAmount > 0 && totalVolume > 0;
    
    if (!dataValid) {
      console.log('⚠️ 数据无效：成交额或成交量为0');
    }
    
    return {
      limitUpCount: limitUp,
      limitDownCount: limitDown,
      maxContinuousLimit: maxContinuousLimit,
      totalVolume: totalVolume,
      totalAmount: totalAmount,
      topics: topics,
      dataValid: dataValid
    };
  } catch (error) {
    console.error('❌ 获取数据失败:', error.message);
    throw error;
  }
}

/**
 * 发送 Telegram 通知
 */
async function sendTelegramNotification(message) {
  try {
    // 这里可以添加 Telegram 发送逻辑
    console.log('📱 发送通知:', message);
  } catch (e) {
    console.error('❌ 通知发送失败:', e.message);
  }
}

/**
 * 保存数据到数据库
 */
async function saveData(marketStats) {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log('📊 市场数据:');
    console.log(`  总成交额: ${(marketStats.totalAmount / 100000000).toFixed(2)} 亿`);
    console.log(`  总成交量: ${(marketStats.totalVolume / 100000000).toFixed(2)} 亿手\n`);
    console.log(`  涨停: ${marketStats.limitUpCount} 条`);
    console.log(`  跌停: ${marketStats.limitDownCount} 条\n`);
    
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
    return true;
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    throw error;
  }
}

/**
 * 执行数据采集主流程
 */
async function runCollection(isRetry = false, isSupplementary = false) {
  const prefix = isRetry ? '🔄 重试' : (isSupplementary ? '⏰ 补采' : '📊 首次');
  console.log(`\n${prefix}采集开始 | ${new Date().toISOString()}\n`);
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // 判断是否为交易日
  const isTodayTradingDay = await isTradingDay(today);
  if (!isTodayTradingDay) {
    console.log(`📅 ${todayStr} 不是交易日，跳过数据采集`);
    return null;
  }
  
  console.log(`📅 今天是交易日: ${todayStr}\n`);
  
  try {
    const marketStats = await getMarketData();
    
    // 检查数据是否有效
    if (!marketStats.dataValid) {
      console.log('⚠️ 数据无效，需要重试');
      return null;
    }
    
    // 数据有效，保存
    await saveData(marketStats);
    return marketStats;
    
  } catch (error) {
    console.error('❌ 采集失败:', error.message);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  isSupplementaryRun = args.includes('--supplementary');
  
  console.log('='.repeat(50));
  console.log('A股数据采集脚本启动');
  console.log(`时间: ${new Date().toISOString()}`);
  console.log(`模式: ${isSupplementaryRun ? '补采(17:00)' : '常规'}`);
  console.log('='.repeat(50));
  
  let result = null;
  let retryCount = 0;
  
  // 首次尝试 + 重试
  while (canRetry(retryCount) && !result) {
    if (retryCount > 0) {
      console.log(`\n⏳ 等待 ${RETRY_DELAY/1000} 秒后重试...`);
      await sleep(RETRY_DELAY);
    }
    
    result = await runCollection(retryCount > 0, isSupplementaryRun);
    retryCount++;
    
    if (result) {
      console.log(`\n✅ 采集成功！（尝试 ${retryCount} 次）`);
    } else if (canRetry(retryCount)) {
      console.log(`\n❌ 采集失败，准备重试...（${retryCount}/${MAX_RETRIES}）`);
    }
  }
  
  // 如果17:00补采模式且首次没成功，继续尝试
  if (!result && isSupplementaryRun) {
    console.log('\n⚠️ 补采模式：17:00 采集失败');
    process.exit(1);
  }
  
  // 如果常规模式在15:30失败，检查是否需要17:00补采
  if (!result) {
    const bt = getBeijingTime();
    const hour = bt.getHours();
    
    console.log('\n' + '='.repeat(50));
    console.log('⚠️ 15:30 采集失败');
    console.log(`当前北京时间: ${bt.toISOString()}`);
    
    // 如果还没到17:00，提示稍后重试
    if (hour < SUPPLEMENTARY_HOUR) {
      console.log(`📌 将在北京时间 ${SUPPLEMENTARY_HOUR}:${SUPPLEMENTARY_MINUTE.toString().padStart(2, '0')} 自动补采`);
      console.log('或手动运行: node collect-data-now.js --supplementary');
    } else if (hour >= SUPPLEMENTARY_HOUR && hour < 18) {
      // 已经是17:00-18:00，执行补采
      console.log('⏰ 进入17:00补采模式...');
      result = await runCollection(false, true);
      
      if (!result) {
        // 补采也失败，再试一次
        console.log('⏳ 补采失败，30秒后再次尝试...');
        await sleep(30000);
        result = await runCollection(true, true);
      }
    }
  }
  
  if (result) {
    console.log('\n✅ 数据采集完成');
    process.exit(0);
  } else {
    console.log('\n❌ 数据采集最终失败');
    process.exit(1);
  }
}

main();
