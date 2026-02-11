async function getAllStocks() {
  const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  let allStocks = [];
  let page = 1;
  
  console.log('正在分页获取所有股票数据...\n');
  
  while (true) {
    const params = new URLSearchParams({
      pn: String(page),
      pz: '500', // 每页500条
      po: '1',
      np: '1',
      ut: 'bd1d9ddb04089700cf9c27f6f7426281',
      fltt: '2',
      invt: '2',
      fid: 'f3',
      fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
      fields: 'f12,f14,f2,f3,f5,f6',
    });

    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();
    
    if (!data.data || !data.data.diff || data.data.diff.length === 0) {
      break;
    }
    
    allStocks = allStocks.concat(data.data.diff);
    console.log(`第${page}页: ${data.data.diff.length}条, 累计: ${allStocks.length}条`);
    
    // 如果返回数量少于500，说明是最后一页
    if (data.data.diff.length < 500) {
      break;
    }
    
    page++;
    
    // 防止无限循环
    if (page > 20) {
      console.log('已达到最大页数限制');
      break;
    }
  }
  
  console.log(`\n✅ 总共获取到 ${allStocks.length} 只股票\n`);
  
  // 统计
  const limitUp = allStocks.filter(s => 
    s.f3 >= 9.9 && 
    !s.f14.includes('ST') && 
    !s.f14.includes('*') &&
    !s.f14.startsWith('N') &&
    !s.f14.startsWith('C')
  );
  
  const limitDown = allStocks.filter(s => 
    s.f3 <= -9.9 && 
    !s.f14.includes('ST') && 
    !s.f14.includes('*') &&
    !s.f14.startsWith('N') &&
    !s.f14.startsWith('C')
  );
  
  const totalAmount = allStocks.reduce((sum, s) => sum + (s.f6 || 0), 0);
  const totalVolume = allStocks.reduce((sum, s) => sum + (s.f5 || 0), 0);
  
  console.log('=== 统计结果 ===');
  console.log(`涨停数量: ${limitUp.length} 家`);
  console.log(`跌停数量: ${limitDown.length} 家`);
  console.log(`总成交额: ${(totalAmount / 100000000).toFixed(2)} 亿元`);
  console.log(`总成交量: ${totalVolume} 手`);
  
  console.log(`\n前10只涨停股票：`);
  limitUp.slice(0, 10).forEach((s, i) => {
    console.log(`${i+1}. ${s.f14} (${s.f12}) - 涨幅${s.f3.toFixed(2)}%`);
  });
}

getAllStocks().catch(e => console.error('错误:', e.message));
