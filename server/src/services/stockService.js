const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
};

const PRIVATE_TICKERS = new Set(['SPACEX', 'SPACE_X']);

let _crumb = null;
let _cookieStr = null;
let _crumbFetch = null;

async function initCrumb() {
  try {
    const r1 = await fetch('https://finance.yahoo.com/', {
      headers: YF_HEADERS,
      redirect: 'follow',
    });
    const setCookies = r1.headers.getSetCookie?.() ?? [];
    _cookieStr = setCookies.map(c => c.split(';')[0]).join('; ');

    const r2 = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...YF_HEADERS, Cookie: _cookieStr },
    });
    _crumb = r2.ok ? (await r2.text()).trim() : '';
  } catch {
    _crumb = '';
    _cookieStr = '';
  }
}

async function ensureCrumb() {
  if (_crumb !== null) return;
  if (!_crumbFetch) _crumbFetch = initCrumb();
  await _crumbFetch;
}

async function fetchJson(url) {
  const headers = { ...YF_HEADERS };
  if (_cookieStr) headers.Cookie = _cookieStr;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

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

export async function getQuote(ticker, market) {
  if (PRIVATE_TICKERS.has(ticker.toUpperCase())) {
    return {
      ticker, market, symbol: ticker, name: ticker,
      price: null, previousClose: null, change: null, changePercent: null,
      currency: 'USD', error: '비상장 주식 - 실시간 조회 불가',
    };
  }

  await ensureCrumb();

  const symbol = buildSymbol(ticker, market);
  try {
    const crumbParam = _crumb ? `&crumb=${encodeURIComponent(_crumb)}` : '';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=1m${crumbParam}`;
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
  await ensureCrumb();
  try {
    const crumbParam = _crumb ? `&crumb=${encodeURIComponent(_crumb)}` : '';
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0${crumbParam}`;
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
