#!/usr/bin/env python3
import akshare as ak
import pandas as pd
from datetime import datetime, timedelta
import sys

def get_date_str(days_ago=0):
    """获取日期字符串，格式为 YYYYMMDD"""
    d = datetime.now() - timedelta(days=days_ago)
    return d.strftime('%Y%m%d')

date_str = get_date_str()
print(f'获取日期: {date_str}', file=sys.stderr)

# 初始化默认值
total_amount = 0
total_volume = 0
limit_up = 0
limit_down = 0
max_continuous_limit = 0
topics = []

# ============ 上海成交数据 ============
try:
    sse = ak.stock_sse_deal_daily(date=date_str)
    sh_amount = float(sse.loc[sse['单日情况'] == '成交金额', '股票'].values[0]) * 100000000
    sh_volume = float(sse.loc[sse['单日情况'] == '成交量', '股票'].values[0]) * 100000000
    total_volume = sh_volume
    print(f'上海成交: {sh_amount/1e8:.2f}亿, {sh_volume/1e8:.2f}亿手', file=sys.stderr)
except Exception as e:
    print(f'上海成交获取失败: {e}', file=sys.stderr)

# ============ 深圳成交数据 ============
try:
    szse = ak.stock_szse_summary(date=date_str)
    sz_stock = szse[szse['证券类别'] == '股票']
    sz_amount = float(sz_stock['成交金额'].values[0])
    total_amount = sh_amount + sz_amount if 'sh_amount' in dir() else sz_amount
    print(f'深圳成交: {sz_amount/1e8:.2f}亿', file=sys.stderr)
except Exception as e:
    print(f'深圳成交获取失败: {e}', file=sys.stderr)
    total_amount = sh_amount if 'sh_amount' in dir() else 0

# ============ 涨停池数据 ============
try:
    zt = ak.stock_zt_pool_em(date=date_str)
    limit_up = len(zt)
    if len(zt) > 0 and '连板数' in zt.columns:
        max_continuous_limit = int(zt['连板数'].max())
    print(f'涨停池 {date_str}: {limit_up} 条, 最高连板: {max_continuous_limit}', file=sys.stderr)
except Exception as e:
    print(f'涨停池获取失败: {e}', file=sys.stderr)

# ============ 跌停池数据 ============
try:
    dt = ak.stock_zt_pool_dtgc_em(date=date_str)
    limit_down = len(dt)
    print(f'跌停池 {date_str}: {limit_down} 条', file=sys.stderr)
except Exception as e:
    print(f'跌停池获取失败: {e}', file=sys.stderr)

# ============ 题材涨幅数据（概念板块-资金流） ============
try:
    print('正在获取概念板块数据...', file=sys.stderr)
    df = ak.stock_fund_flow_concept()
    print(f'获取到 {len(df)} 条概念板块数据', file=sys.stderr)
    
    # 这个API已经按资金流排序了，直接取前10
    for i, row in df.head(10).iterrows():
        topic_name = str(row.get('行业', ''))
        # 用主题名称的拼音首字母或hash作为code
        import hashlib
        code = hashlib.md5(topic_name.encode()).hexdigest()[:8]
        topics.append({
            'code': code,
            'name': topic_name,
            'changePercent': float(row.get('行业-涨跌幅', 0) or 0),
            'closePrice': float(row.get('当前价', 0)) if row.get('当前价') else None
        })
    print(f'概念板块获取成功: {len(topics)} 条', file=sys.stderr)
    if topics:
        print(f'TOP1: {topics[0]["name"]} {topics[0]["changePercent"]}%', file=sys.stderr)
        
except Exception as e:
    print(f'概念板块获取失败: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()

# ============ 输出结果 ============
print('SUCCESS')
print(f'TOTAL_AMOUNT:{int(total_amount)}')
print(f'TOTAL_VOLUME:{int(total_volume)}')
print(f'LIMIT_UP:{limit_up}')
print(f'LIMIT_DOWN:{limit_down}')
print(f'MAX_CONTINUOUS_LIMIT:{max_continuous_limit}')

if topics:
    print('TOPICS_START')
    for t in topics:
        print(f"{t['code']}|{t['name']}|{t['changePercent']}|{t['closePrice'] or ''}")
    print('TOPICS_END')
