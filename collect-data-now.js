const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ekbjjkcuqqskraubogzl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrYmpqa2N1cXFza3JhdWJvZ3psIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM0NzMzNywiZXhwIjoyMDg0OTIzMzM3fQ.fgCOW2kyJHIQe2ombEW_GMoEWRukO_yix2-7zIktDQA'
);

async function getStockData() {
  console.log('正在从东方财富API获取数据...\n');
  
  const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  
  const params = new URLSearchParams({
    pn: '1',
    pz: '5000',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3,f5,f6,f62',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  const data = await response.json();
  
  if (!data.data || !data.data.diff) {
    throw new Error('API返回数据异常');
  }
  
  const stocks = data.data.diff;
  
  // 统计
  const limitUp = stocks.filter(s => s.f3 >= 9.9 && !s.f14.includes('ST') && !s.f14.includes('*') && !s.f14.startsWith('N'));
  const limitDown = stocks.filter(s => s.f3 <= -9.9 && !s.f14.includes('ST') && !s.f14.includes('*') && !s.f14.startsWith('N'));
  
  // 过滤异常的连板数据（只取合理范围 0-50）
  const validLimits = stocks
    .map(s => s.f62 || 0)
    .filter(v => v >= 0 && v <= 50);
  const maxLimit = validLimits.length > 0 ? Math.max(...validLimits) : 0;
  
  const totalVolume = stocks.reduce((sum, s) => sum + (s.f5 || 0), 0);
  const totalAmount = stocks.reduce((sum, s) => sum + (s.f6 || 0), 0);
  
  console.log('📊 市场数据:');
  console.log(`  涨停: ${limitUp.length} 家`);
  console.log(`  跌停: ${limitDown.length} 家`);
  console.log(`  最高连板: ${maxLimit} 连`);
  console.log(`  总成交量: ${totalVolume} 手`);
  console.log(`  总成交额: ${(totalAmount / 100000000).toFixed(2)} 亿\n`);
  
  return {
    limitUpCount: limitUp.length,
    limitDownCount: limitDown.length,
    maxContinuousLimit: maxLimit,
    totalVolume: totalVolume,
    totalAmount: totalAmount,
  };
}

async function getTopicData() {
  console.log('正在获取题材数据...\n');
  
  const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  const params = new URLSearchParams({
    pn: '1',
    pz: '50',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:90+t:3',
    fields: 'f12,f14,f2,f3',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  const data = await response.json();
  
  if (!data.data || !data.data.diff) {
    throw new Error('API返回数据异常');
  }
  
  console.log(`📈 获取到 ${data.data.diff.length} 个题材\n`);
  
  return data.data.diff.map((t, i) => ({
    topic_code: t.f12,
    topic_name: t.f14,
    change_percent: t.f3,
    close_price: t.f2,
    rank: i + 1,
  }));
}

async function saveData() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const marketStats = await getStockData();
    
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
    
    const topics = await getTopicData();
    
    await supabase.from('topic_rankings').delete().eq('stat_date', today);
    
    console.log('保存题材数据...');
    const topicRows = topics.map(t => ({
      stat_date: today,
      ...t
    }));
    
    const { error: topicError } = await supabase
      .from('topic_rankings')
      .insert(topicRows);
    
    if (topicError) {
      console.error('❌ 题材数据保存失败:', topicError);
      throw topicError;
    }
    console.log('✅ 题材数据已保存\n');
    
    console.log('🎉 所有数据收集完成！');
    console.log(`\n现在访问 http://localhost:3000/dashboard 查看看板`);
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

saveData();
