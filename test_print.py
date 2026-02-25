#!/usr/bin/env python3
print("开始运行...")

import akshare as ak
import baostock as bs
from datetime import datetime

print("正在获取数据...")

# 打印日期
today = datetime.now().strftime('%Y-%m-%d')
print(f"今天是: {today}")

# 测试 Akshare
print("\n=== Akshare 测试 ===")
try:
    sse = ak.stock_sse_deal_daily()
    print("上海数据获取成功!")
    print(sse)
except Exception as e:
    print(f"错误: {e}")

# 测试 Baostock
print("\n=== Baostock 测试 ===")
try:
    lg = bs.login()
    print(f"登录: {lg.error_msg}")
    
    rs = bs.query_history_k_data_plus('sh.000001', 'date,amount', '2026-02-24', '2026-02-24', 'd', '2')
    data = rs.get_row_data()
    print(f"沪市数据: {data}")
    
    bs.logout()
except Exception as e:
    print(f"错误: {e}")

print("\n完成!")
