#!/usr/bin/env python3
import sys
import json
import warnings
from concurrent.futures import ThreadPoolExecutor, as_completed
warnings.filterwarnings('ignore')

import yfinance as yf

PRIVATE_TICKERS = {'SPACEX', 'SPACE_X'}

def build_symbol(ticker, market):
    if market == 'KS':
        return f"{ticker}.KS"
    if market == 'KQ':
        return f"{ticker}.KQ"
    return ticker

def get_quote(ticker, market):
    if ticker.upper() in PRIVATE_TICKERS:
        return {
            'ticker': ticker, 'market': market, 'symbol': ticker,
            'name': '스페이스X', 'price': None, 'previousClose': None,
            'change': None, 'changePercent': None, 'currency': 'USD',
            'error': '비상장 주식 - 실시간 조회 불가',
        }
    symbol = build_symbol(ticker, market)
    try:
        t = yf.Ticker(symbol)
        fi = t.fast_info
        price = fi.get('lastPrice')
        prev = fi.get('previousClose')
        currency = fi.get('currency', 'USD')
        change = (price - prev) if price and prev else None
        change_pct = ((price - prev) / prev * 100) if price and prev else None
        return {
            'ticker': ticker,
            'market': market,
            'symbol': symbol,
            'name': fi.get('name') or ticker,
            'price': price,
            'previousClose': prev,
            'change': change,
            'changePercent': change_pct,
            'currency': currency,
        }
    except Exception as e:
        return {'ticker': ticker, 'market': market, 'error': str(e)}

def get_quotes_parallel(items, max_workers=6):
    results = [None] * len(items)
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(get_quote, item['ticker'], item['market']): i
            for i, item in enumerate(items)
        }
        for future in as_completed(futures):
            idx = futures[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                results[idx] = {
                    'ticker': items[idx]['ticker'],
                    'market': items[idx]['market'],
                    'error': str(e),
                }
    return results

def search_stocks(query):
    try:
        t = yf.Ticker(query)
        fi = t.fast_info
        price = fi.get('lastPrice')
        if price:
            sym = query.upper()
            market = 'KS' if sym.endswith('.KS') else 'KQ' if sym.endswith('.KQ') else 'US'
            return [{'symbol': sym, 'name': sym, 'exchange': '', 'market': market}]
        return []
    except:
        return []

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'quote'
    data = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

    if cmd == 'quote':
        result = get_quote(data['ticker'], data['market'])
        print(json.dumps(result))

    elif cmd == 'quotes':
        results = get_quotes_parallel(data)
        print(json.dumps(results))

    elif cmd == 'search':
        results = search_stocks(data['query'])
        print(json.dumps(results))
