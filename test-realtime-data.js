async function testAPI() {
  const baseUrl = 'https://push2.eastmoney.com/api/qt/clist/get';
  
  // 测试1：涨停股票
  console.log('=== 测试涨停股票（涨幅>9.9%） ===\n');
  const params1 = new URLSearchParams({
    pn: '1',
    pz: '20',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f3',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3,f62',
  });
  
  const res1 = await fetch(`${baseUrl}?${params1}`);
  const data1 = await res1.json();
  
  if (data1.data && data1.data.diff) {
    const limitUp = data1.data.diff.filter(s => s.f3 >= 9.9 && !s.f14.includes('ST'));
    console.log(`涨停股票（前20）：`);
    limitUp.slice(0, 5).forEach(s => {
      console.log(`  ${s.f14} (${s.f12}): 涨幅 ${s.f3}%, 连板 ${s.f62 || '未知'}`);
    });
    console.log(`\n总计涨停: ${limitUp.length} 家（仅显示前20页数据）\n`);
  }
  
  // 测试2：连板股票
  console.log('=== 测试连板股票（f62字段） ===\n');
  const params2 = new URLSearchParams({
    pn: '1',
    pz: '50',
    po: '1',
    np: '1',
    ut: 'bd1d9ddb04089700cf9c27f6f7426281',
    fltt: '2',
    invt: '2',
    fid: 'f62',
    fs: 'm:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23',
    fields: 'f12,f14,f2,f3,f62',
  });
  
  const res2 = await fetch(`${baseUrl}?${params2}`);
  const data2 = await res2.json();
  
  if (data2.data && data2.data.diff) {
    const withLimit = data2.data.diff.filter(s => s.f62 && s.f62 > 0 && s.f62 < 1000);
    console.log(`连板股票（按f62排序）：`);
    withLimit.slice(0, 10).forEach(s => {
      console.log(`  ${s.f14} (${s.f12}): 涨幅 ${s.f3}%, f62=${s.f62}`);
    });
    
    if (withLimit.length > 0) {
      const max = Math.max(...withLimit.map(s => s.f62));
      console.log(`\n最高连板（f62最大值）: ${max}\n`);
    }
  }
  
  console.log('\n请告诉我：');
  console.log('1. 同花顺显示今天涨停多少家？');
  console.log('2. 同花顺显示最高几连板？哪只股票？');
  console.log('3. 同花顺显示跌停多少家？');
}

testAPI().catch(e => console.error('错误:', e.message));
