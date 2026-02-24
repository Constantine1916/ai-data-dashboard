#!/usr/bin/env python3
import akshare as ak
from datetime import datetime, timedelta
import sys

def get_date_str(days_ago=0):
    """获取日期字符串，格式为 YYYYMMDD"""
    d = datetime.now() - timedelta(days=days_ago)
    return d.strftime('%Y%m%d')

try:
    # ============ 成交额数据 ============
    # 上海每日概况
    date_str = get_date_str()
    print(f'获取日期: {date_str}', file=sys.stderr)
    
    sse = ak.stock_sse_deal_daily(date=date_str)
    sh_amount = float(sse.loc[sse['单日情况'] == '成交金额', '股票'].values[0]) * 100000000
    sh_volume = float(sse.loc[sse['单日情况'] == '成交量', '股票'].values[0]) * 100000000

    # 深圳成交数据
    szse = ak.stock_szse_summary(date=date_str)
    sz_stock = szse[szse['证券类别'] == '股票']
    sz_amount = float(sz_stock['成交金额'].values[0])

    # 总成交额
    total_amount = sh_amount + sz_amount
    
    # ============ 涨跌停数据 ============
    # 用昨天的日期（因为当天收盘后才会统计）
    yesterday = get_date_str(1)
    
    limit_up = 0
    limit_down = 0
    
    try:
        # 涨停池
        zt = ak.stock_zt_pool_em(date=yesterday)
        limit_up = len(zt)
        print(f'涨停池 {yesterday}: {limit_up} 条', file=sys.stderr)
    except Exception as e:
        print(f'涨停池获取失败: {e}', file=sys.stderr)
    
    try:
        # 跌停池
        dt = ak.stock_zt_pool_dtgc_em(date=yesterday)
        limit_down = len(dt)
        print(f'跌停池 {yesterday}: {limit_down} 条', file=sys.stderr)
    except Exception as e:
        print(f'跌停池获取失败: {e}', file=sys.stderr)
    
    # ============ 输出结果 ============
    print('SUCCESS')
    print(f'TOTAL_AMOUNT:{int(total_amount)}')
    print(f'TOTAL_VOLUME:{int(sh_volume)}')
    print(f'LIMIT_UP:{limit_up}')
    print(f'LIMIT_DOWN:{limit_down}')
    
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    import traceback
    traceback.print_exc()
    sys.exit(1)
