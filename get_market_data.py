#!/usr/bin/env python3
import akshare as ak
import sys

try:
    # ============ 成交额数据 ============
    # 上海每日概况
    sse = ak.stock_sse_deal_daily(date='20260224')
    sh_amount = float(sse.loc[sse['单日情况'] == '成交金额', '股票'].values[0]) * 100000000
    sh_volume = float(sse.loc[sse['单日情况'] == '成交量', '股票'].values[0]) * 100000000

    # 深圳成交数据
    szse = ak.stock_szse_summary(date='20260224')
    sz_stock = szse[szse['证券类别'] == '股票']
    sz_amount = float(sz_stock['成交金额'].values[0])

    # 总成交额
    total_amount = sh_amount + sz_amount
    
    # ============ 涨跌停数据 ============
    # 尝试获取涨停池
    limit_up = 0
    limit_down = 0
    
    try:
        # 昨日涨停
        zt_prev = ak.stock_zt_pool_previous_em()
        if len(zt_prev) > 0:
            limit_up = len(zt_prev)
            print(f'昨日涨停: {limit_up} 只', file=sys.stderr)
    except Exception as e:
        print(f'涨停池获取失败: {e}', file=sys.stderr)
    
    try:
        # 跌停池 (强势股/跌停)
        dt_pool = ak.stock_zt_pool_strong_em()
        # 跌停的判断：跌幅接近 -10%
        if len(dt_pool) > 0 and '涨跌幅' in dt_pool.columns:
            limit_down = len(dt_pool[dt_pool['涨跌幅'] <= -9.5])
            print(f'跌停: {limit_down} 只', file=sys.stderr)
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
    sys.exit(1)
