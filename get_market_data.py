#!/usr/bin/env python3
import akshare as ak
from datetime import datetime, timedelta
import sys
import time
from market_data_sources import (
    fetch_limit_down_pool,
    fetch_limit_up_pool,
    fetch_market_totals,
)

# 重试配置
MAX_RETRIES = 3
RETRY_DELAY = 60  # 1分钟

def get_date_str(days_ago=0):
    """获取日期字符串，格式为 YYYYMMDD"""
    d = datetime.now() - timedelta(days=days_ago)
    return d.strftime('%Y%m%d')

def retry_get(func, *args, name="数据", **kwargs):
    """带重试的数据获取函数"""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            if attempt < MAX_RETRIES:
                print(f"⚠️ {name}获取失败 (尝试 {attempt}/{MAX_RETRIES}): {e}", file=sys.stderr)
                print(f"⏳ 等待 {RETRY_DELAY} 秒后重试...", file=sys.stderr)
                time.sleep(RETRY_DELAY)
            else:
                print(f"❌ {name}获取失败 (已重试 {MAX_RETRIES} 次): {e}", file=sys.stderr)
                raise

date_str = get_date_str()
print(f'获取日期: {date_str}', file=sys.stderr)

# 初始化默认值
total_amount = 0
total_volume = 0
limit_up = 0
limit_down = 0
max_continuous_limit = 0
topics = []

# ============ 沪深成交数据 ============
try:
    market_totals = retry_get(fetch_market_totals, name="沪深成交")
    total_amount = market_totals["amount"]
    total_volume = market_totals["volume"]
    print(
        f'沪深成交: {total_amount/1e8:.2f}亿, 成交量 {total_volume:.0f}',
        file=sys.stderr
    )
except Exception as e:
    print(f'沪深成交获取失败: {e}', file=sys.stderr)

# ============ 涨停池数据 ============
try:
    zt = retry_get(fetch_limit_up_pool, date_str, name="涨停池")
    limit_up = zt["count"]
    max_continuous_limit = zt["max_limit_days"]
    print(f'涨停池 {date_str}: {limit_up} 条, 最高连板: {max_continuous_limit}', file=sys.stderr)
except Exception as e:
    print(f'涨停池获取失败: {e}', file=sys.stderr)

# ============ 跌停池数据 ============
try:
    dt = retry_get(fetch_limit_down_pool, date_str, name="跌停池")
    limit_down = dt["count"]
    print(f'跌停池 {date_str}: {limit_down} 条', file=sys.stderr)
except Exception as e:
    print(f'跌停池获取失败: {e}', file=sys.stderr)

# ============ 题材涨幅数据（概念板块-资金流） ============
try:
    print('正在获取概念板块数据...', file=sys.stderr)
    df = retry_get(ak.stock_fund_flow_concept, name="概念板块")
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
