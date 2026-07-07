import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen


EASTMONEY_STOCK_URL = "https://push2.eastmoney.com/api/qt/stock/get"
EASTMONEY_LIMIT_UP_URL = "https://push2ex.eastmoney.com/getTopicZTPool"
EASTMONEY_LIMIT_DOWN_URL = "https://push2ex.eastmoney.com/getTopicDTPool"
TENCENT_INDEX_URL = "https://qt.gtimg.cn/q=sh000001,sz399001"

REQUEST_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/json,text/plain,*/*",
    "Referer": "https://quote.eastmoney.com/",
}


def fetch_json(url, timeout=20):
    request = Request(url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_text(url, timeout=20, encoding="utf-8"):
    request = Request(url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode(encoding, errors="replace")


def parse_index_totals(payloads):
    total_volume = 0
    total_amount = 0.0

    for payload in payloads:
        data = payload.get("data") or {}
        volume = data.get("f47") or 0
        amount = data.get("f48") or 0

        total_volume += int(float(volume))
        total_amount += float(amount)

    if total_volume <= 0 or total_amount <= 0:
        raise ValueError("EastMoney index payload did not contain positive f47/f48 values")

    return {
        "volume": total_volume,
        "amount": total_amount,
    }


def parse_tencent_index_totals(text):
    total_volume = 0
    total_amount = 0.0

    for row in [item.strip() for item in text.split(";") if item.strip()]:
        if "=" not in row:
            continue
        payload = row.split("=", 1)[1].strip().strip('"')
        parts = payload.split("~")
        combined = next(
            (
                part for part in parts
                if part.count("/") == 2 and all(segment.replace(".", "", 1).isdigit() for segment in part.split("/"))
            ),
            None,
        )
        if not combined:
            continue

        _, volume, amount = combined.split("/")
        total_volume += int(float(volume))
        total_amount += float(amount)

    if total_volume <= 0 or total_amount <= 0:
        raise ValueError("Tencent index payload did not contain positive volume/amount values")

    return {
        "volume": total_volume,
        "amount": total_amount,
    }


def fetch_tencent_market_totals():
    return parse_tencent_index_totals(fetch_text(TENCENT_INDEX_URL, encoding="gbk"))


def fetch_market_totals():
    params = {
        "fields": "f43,f47,f48,f57,f58",
    }
    urls = [
        f"{EASTMONEY_STOCK_URL}?{urlencode({**params, 'secid': '1.000001'})}",
        f"{EASTMONEY_STOCK_URL}?{urlencode({**params, 'secid': '0.399001'})}",
    ]

    try:
        return parse_index_totals([fetch_json(url) for url in urls])
    except Exception:
        return fetch_tencent_market_totals()


def _to_price(raw_price):
    if raw_price is None:
        return 0
    return float(raw_price) / 1000


def parse_limit_pool(payload, limit_day_field):
    data = payload.get("data") or {}
    pool = data.get("pool") or []
    count = int(data.get("tc") or len(pool))

    stocks = []
    max_limit_days = 0

    for item in pool:
        limit_days = int(item.get(limit_day_field) or 0)
        max_limit_days = max(max_limit_days, limit_days)
        stocks.append({
            "code": item.get("c") or "",
            "name": item.get("n") or "",
            "percent": float(item.get("zdp") or 0),
            "price": _to_price(item.get("p")),
            "limitDays": limit_days,
            "industry": item.get("hybk") or "",
            "amount": float(item.get("amount") or 0),
        })

    return {
        "count": count,
        "max_limit_days": max_limit_days,
        "stocks": stocks,
    }


def fetch_limit_up_pool(date):
    params = {
        "ut": "7eea3edcaed734bea9cbfc24409ed989",
        "dpt": "wz.ztzt",
        "Pageindex": "0",
        "pagesize": "10000",
        "sort": "fbt:asc",
        "date": date,
    }
    payload = fetch_json(f"{EASTMONEY_LIMIT_UP_URL}?{urlencode(params)}")
    return parse_limit_pool(payload, limit_day_field="lbc")


def fetch_limit_down_pool(date):
    params = {
        "ut": "7eea3edcaed734bea9cbfc24409ed989",
        "dpt": "wz.ztzt",
        "Pageindex": "0",
        "pagesize": "10000",
        "sort": "fund:asc",
        "date": date,
    }
    payload = fetch_json(f"{EASTMONEY_LIMIT_DOWN_URL}?{urlencode(params)}")
    return parse_limit_pool(payload, limit_day_field="days")
