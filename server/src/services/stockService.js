// 미국 주식: Twelve Data API
// 한국 주식: 네이버 모바일 증권 API

const PRIVATE_TICKERS = new Set(['SPACEX', 'SPACE_X']);
const TD_API_KEY = process.env.TWELVE_DATA_API_KEY || '';
const NAVER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  'Referer': 'https://m.stock.naver.com/',
};

function isKorean(market) {
  return market === 'KS' || market === 'KQ';
}

export function buildTradingViewSymbol(ticker, market) {
  if (market === 'KS') return `KRX:${ticker}`;
  if (market === 'KQ') return `KOSDAQ:${ticker}`;
  return ticker.toUpperCase();
}

async function getKoreanQuote(ticker, market) {
  const r = await fetch(`https://m.stock.naver.com/api/stock/${ticker}/basic`, {
    headers: NAVER_HEADERS,
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();

  const priceStr = (d.closePrice || '').replace(/,/g, '');
  const changeStr = (d.compareToPreviousClosePrice || '').replace(/,/g, '');
  const price = parseFloat(priceStr);
  const change = parseFloat(changeStr);
  const changePercent = parseFloat(d.fluctuationsRatio);
  const prev = price - change;

  return {
    ticker, market,
    symbol: ticker,
    name: d.stockName || ticker,
    price,
    previousClose: prev,
    change,
    changePercent,
    currency: 'KRW',
    marketState: 'REGULAR',
  };
}

async function getUsQuote(ticker, market) {
  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(ticker)}&apikey=${TD_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (d.status === 'error' || d.code) throw new Error(d.message || '시세 조회 실패');

  return {
    ticker, market,
    symbol: ticker,
    name: d.name || ticker,
    price: parseFloat(d.close),
    previousClose: parseFloat(d.previous_close),
    change: parseFloat(d.change),
    changePercent: parseFloat(d.percent_change),
    currency: d.currency || 'USD',
    marketState: d.is_market_open ? 'REGULAR' : 'CLOSED',
  };
}

export async function getQuote(ticker, market) {
  if (PRIVATE_TICKERS.has(ticker.toUpperCase())) {
    return {
      ticker, market, symbol: ticker, name: ticker,
      price: null, previousClose: null, change: null, changePercent: null,
      currency: 'USD', error: '비상장 주식 - 실시간 조회 불가',
    };
  }

  try {
    if (isKorean(market)) {
      return await getKoreanQuote(ticker, market);
    } else {
      return await getUsQuote(ticker, market);
    }
  } catch (e) {
    throw new Error(`${ticker} 시세 조회 실패: ${e.message}`);
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
    const url = `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${TD_API_KEY}`;
    const r = await fetch(url);
    const d = await r.json();
    return (d.data || [])
      .filter(q => ['Common Stock', 'ETF'].includes(q.instrument_type))
      .slice(0, 10)
      .map(q => ({
        symbol: q.symbol,
        name: q.instrument_name,
        exchange: q.exchange,
        market: detectMarket(q.symbol, q.exchange),
      }));
  } catch {
    return [];
  }
}

function detectMarket(symbol, exchange) {
  if (['KRX', 'KOSDAQ', 'KOSPI'].includes(exchange)) return 'KS';
  return 'US';
}
