const TOKEN = '744b177800423216f3a445a446d0f1aebf15f6210b953d68291fc8b4';
const API_URL = 'http://api.tushare.pro';

async function callTushare(apiName, params = {}) {
  const payload = {
    api_name: apiName,
    token: TOKEN,
    params: params,
    fields: ''
  };
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  const result = await response.json();
  
  if (result.code !== 0) {
    throw new Error(result.msg || '调用失败');
  }
  
  // 转换为对象数组
  const { fields, items } = result.data;
  return items.map(item => {
    const obj = {};
    fields.forEach((field, i) => {
      obj[field] = item[i];
    });
    return obj;
  });
}

async function testFreeAPIs() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  console.log('测试日期:', today, '\n');
  
  try {
    console.log('=== 1. 涨跌停数据 (limit_list) ===');
    const limitData = await callTushare('limit_list', { trade_date: today });
    const limitUp = limitData.filter(d => d.limit === 'U');
    const limitDown = limitData.filter(d => d.limit === 'D');
    console.log('涨停数量:', limitUp.length);
    console.log('跌停数量:', limitDown.length);
    if (limitUp.length > 0) {
      console.log('涨停样例:', limitUp.slice(0, 3).map(d => `${d.name}(${d.ts_code})`));
    }
    console.log('');
  } catch (e) {
    console.log('❌ limit_list 失败:', e.message, '\n');
  }
  
  try {
    console.log('=== 2. 日线行情 (daily) ===');
    const daily = await callTushare('daily', { trade_date: today });
    console.log('股票数量:', daily.length);
    
    // 统计涨停（涨幅>=9.9%）
    const limitUpByPct = daily.filter(d => d.pct_chg >= 9.9 && !d.ts_code.startsWith('ST'));
    console.log('涨幅>=9.9%:', limitUpByPct.length, '家');
    
    // 计算总成交额
    const totalAmount = daily.reduce((sum, d) => sum + (d.amount || 0), 0);
    console.log('总成交额:', (totalAmount / 10000).toFixed(2), '亿');
    console.log('');
  } catch (e) {
    console.log('❌ daily 失败:', e.message, '\n');
  }
  
  try {
    console.log('=== 3. 概念板块 (concept) ===');
    const concepts = await callTushare('concept', {});
    console.log('板块数量:', concepts.length);
    console.log('样例:', concepts.slice(0, 3).map(c => c.name));
    console.log('');
  } catch (e) {
    console.log('❌ concept 失败:', e.message, '\n');
  }
}

testFreeAPIs().catch(e => console.error('总体错误:', e));
