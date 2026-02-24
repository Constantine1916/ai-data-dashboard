#!/usr/bin/env python3
import akshare as ak
import sys

try:
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

    print('SUCCESS')
    print(total_amount)
    print(sh_volume)
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    sys.exit(1)
