async function getLimitUpData() {
  const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  
  console.log('正在获取涨停数据...\n');
  
  // 获取所有A股数据
  const params = new URLSearchParams({
    pn: '1',
    pz: '5000', // 获取5000条数据
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3', // 按涨跌幅排序
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23', // A股
    fields: 'f12,f14,f2,f3,f4,f5,f6,f15,f16,f17,f18',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  const data = await response.json();
  
  if (!data.data || !data.data.diff) {
    console.log('❌ API返回数据异常');
    return;
  }
  
  const stocks = data.data.diff;
  console.log(`📊 总共获取到 ${stocks.length} 只股票\n`);
  
  // 涨停标准：涨幅 >= 9.9%，排除ST、*ST、N字头新股
  const limitUp = stocks.filter(s => 
    s.f3 >= 9.9 && 
    !s.f14.includes('ST') && 
    !s.f14.includes('*') &&
    !s.f14.startsWith('N') &&
    !s.f14.startsWith('C')
  );
  
  console.log('=== 涨停股票（涨幅>=9.9%，排除ST/新股） ===\n');
  console.log(`✅ 涨停数量: ${limitUp.length} 家\n`);
  
  console.log('前20只涨停股票：');
  limitUp.slice(0, 20).forEach((s, i) => {
    console.log(`${i+1}. ${s.f14.padEnd(12)} (${s.f12})  涨幅: ${s.f3.toFixed(2)}%  现价: ${s.f2}`);
  });
  
  console.log('\n=== 跌停股票（跌幅<=-9.9%，排除ST/新股） ===\n');
  
  const limitDown = stocks.filter(s => 
    s.f3 <= -9.9 && 
    !s.f14.includes('ST') && 
    !s.f14.includes('*') &&
    !s.f14.startsWith('N') &&
    !s.f14.startsWith('C')
  );
  
  console.log(`✅ 跌停数量: ${limitDown.length} 家\n`);
  
  if (limitDown.length > 0) {
    console.log('前10只跌停股票：');
    limitDown.slice(0, 10).forEach((s, i) => {
      console.log(`${i+1}. ${s.f14.padEnd(12)} (${s.f12})  跌幅: ${s.f3.toFixed(2)}%  现价: ${s.f2}`);
    });
  }
  
  // 统计总成交额
  const totalAmount = stocks.reduce((sum, s) => sum + (s.f6 || 0), 0);
  console.log(`\n=== 市场概况 ===`);
  console.log(`总成交额: ${(totalAmount / 100000000).toFixed(2)} 亿元`);
  console.log(`总成交量: ${stocks.reduce((sum, s) => sum + (s.f5 || 0), 0)} 手`);
}

getLimitUpData().catch(e => console.error('错误:', e.message));
