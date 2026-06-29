const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
};

const PRIVATE_TICKERS = new Set(['SPACEX', 'SPACE_X']);

function buildSymbol(ticker, market) {
  if (market === 'KS') return `${ticker}.KS`;
  if (market === 'KQ') return `${ticker}.KQ`;
  return ticker.toUpperCase();
}

export function buildTradingViewSymbol(ticker, market) {
  if (market === 'KS') return `KRX:${ticker}`;
  if (market === 'KQ') return `KOSDAQ:${ticker}`;
  return ticker.toUpperCase();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getQuote(ticker, market) {
  if (PRIVATE_TICKERS.has(ticker.toUpperCase())) {
    return {
      ticker, market, symbol: ticker, name: ticker,
      price: null, previousClose: null, change: null, changePercent: null,
      currency: 'USD', error: '비상장 주식 - 실시간 조회 불가',
    };
  }

  const symbol = buildSymbol(ticker, market);
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m`;
    const data = await fetchJson(url);
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('데이터 없음');

    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    const change = price != null && prev != null ? price - prev : null;
    const changePercent = change != null && prev ? (change / prev) * 100 : null;

    return {
      ticker, market, symbol,
      name: meta.longName || meta.shortName || ticker,
      price, previousClose: prev, change, changePercent,
      currency: meta.currency || (market === 'KS' || market === 'KQ' ? 'KRW' : 'USD'),
      marketState: meta.marketState,
    };
  } catch (e) {
    throw new Error(`${symbol} 시세 조회 실패: ${e.message}`);
  }
}

export async function getQuotes(items) {
  const results = await Promise.allSettled(
    items.map(({ ticker, market }) => getQuote(ticker, market))
  );
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { ...items[i], error: r.reason.message }
  );
}

export async function searchStock(query) {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const data = await fetchJson(url);
    return (data.quotes || [])
      .filter(q => q.quoteType === 'EQUITY')
      .slice(0, 10)
      .map(q => ({
        symbol: q.symbol,
        name: q.longname || q.shortname || q.symbol,
        exchange: q.exchange,
        market: detectMarket(q.symbol, q.exchange),
      }));
  } catch {
    return [];
  }
}

function detectMarket(symbol, exchange) {
  if (symbol.endsWith('.KS')) return 'KS';
  if (symbol.endsWith('.KQ')) return 'KQ';
  if (['KSC', 'KOE'].includes(exchange)) return 'KS';
  return 'US';
}
