import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, BarChart2 } from 'lucide-react';
import { useApi } from '../hooks/useApi.js';
import StockChart from '../components/StockChart.jsx';

function formatPrice(price, currency) {
  if (price == null) return '-';
  if (currency === 'KRW') return `${Math.round(price).toLocaleString('ko-KR')}원`;
  return `$${price.toFixed(2)}`;
}

function PriceChange({ value, currency }) {
  if (value == null) return <span className="text-gray-500">-</span>;
  const up = value >= 0;
  const sign = up ? '+' : '';
  const fmt = currency === 'KRW'
    ? `${sign}${Math.round(value).toLocaleString('ko-KR')}원`
    : `${sign}${value.toFixed(2)}%`;
  return <span className={up ? 'text-red-400' : 'text-blue-400'}>{fmt}</span>;
}

function QuoteCard({ q, onClick, selected }) {
  const up = (q.changePercent ?? 0) >= 0;
  const hasPrice = q.price != null;
  return (
    <div
      onClick={() => onClick(q)}
      className={`bg-gray-900 rounded-xl p-4 cursor-pointer transition-all border ${
        selected ? 'border-indigo-500' : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <p className="font-semibold text-white text-sm truncate">{q.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {q.ticker} · {q.market === 'US' ? 'US' : q.market === 'KS' ? 'KOSPI' : 'KOSDAQ'}
          </p>
        </div>
        {hasPrice && (
          <span className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${up ? 'bg-red-900/40' : 'bg-blue-900/40'}`}>
            {up ? <TrendingUp size={14} className="text-red-400" /> : <TrendingDown size={14} className="text-blue-400" />}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xl font-bold text-white">{formatPrice(q.price, q.currency)}</p>
        {hasPrice ? (
          <div className="flex items-center gap-2 mt-1 text-sm">
            <span className={(q.changePercent ?? 0) >= 0 ? 'text-red-400' : 'text-blue-400'}>
              {(q.changePercent ?? 0) >= 0 ? '+' : ''}{(q.changePercent ?? 0).toFixed(2)}%
            </span>
            <span className="text-gray-600">|</span>
            <PriceChange value={q.change} currency={q.currency} />
          </div>
        ) : (
          q.error && <p className="text-xs text-gray-500 mt-1">{q.error}</p>
        )}
      </div>
    </div>
  );
}

function mergeNames(quotes, dbItems) {
  return (quotes || []).map(q => {
    const dbItem = dbItems?.find(d => d.ticker === q.ticker && d.market === q.market);
    return { ...q, name: dbItem?.name || q.name || q.ticker };
  });
}

export default function Dashboard() {
  const [selectedStock, setSelectedStock] = useState(null);
  const { data: holdings } = useApi('/api/holdings');
  const { data: watchlist } = useApi('/api/watchlist');

  const uniqueHoldings = (holdings || []).filter(
    (h, i, arr) => arr.findIndex(x => x.ticker === h.ticker && x.market === h.market) === i
  );

  const allItems = [
    ...uniqueHoldings.map(h => ({ ticker: h.ticker, market: h.market })),
    ...(watchlist || [])
      .filter(w => !uniqueHoldings.some(h => h.ticker === w.ticker && h.market === w.market))
      .map(w => ({ ticker: w.ticker, market: w.market })),
  ];

  const queryStr = allItems.length
    ? `?items=${encodeURIComponent(JSON.stringify(allItems))}`
    : null;

  const { data: rawQuotes, loading, refetch } = useApi(
    queryStr ? `/api/stocks/quotes${queryStr}` : null,
    { interval: 60000 }
  );

  const holdingQuotes = mergeNames(
    rawQuotes?.filter(q => uniqueHoldings.some(h => h.ticker === q.ticker && h.market === q.market)),
    holdings
  );

  const watchQuotes = mergeNames(
    rawQuotes?.filter(q =>
      (watchlist || []).some(w => w.ticker === q.ticker && w.market === q.market) &&
      !uniqueHoldings.some(h => h.ticker === q.ticker && h.market === q.market)
    ),
    watchlist
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">대시보드</h2>
        <button
          onClick={refetch}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          새로고침
        </button>
      </div>

      {!allItems.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <BarChart2 size={40} className="mb-3 opacity-30" />
          <p>매수 이력 또는 관심 종목을 추가해 주세요</p>
        </div>
      ) : (
        <>
          {loading && !rawQuotes && (
            <div className="text-center py-8 text-gray-500 text-sm">시세 조회 중...</div>
          )}
          {holdingQuotes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">보유 종목</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {holdingQuotes.map(q => (
                  <QuoteCard
                    key={`${q.ticker}-${q.market}`}
                    q={q}
                    onClick={setSelectedStock}
                    selected={selectedStock?.ticker === q.ticker && selectedStock?.market === q.market}
                  />
                ))}
              </div>
            </section>
          )}
          {watchQuotes.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">관심 종목</h3>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {watchQuotes.map(q => (
                  <QuoteCard
                    key={`${q.ticker}-${q.market}`}
                    q={q}
                    onClick={setSelectedStock}
                    selected={selectedStock?.ticker === q.ticker && selectedStock?.market === q.market}
                  />
                ))}
              </div>
            </section>
          )}
          {selectedStock && (
            <StockChart
              ticker={selectedStock.ticker}
              market={selectedStock.market}
              name={selectedStock.name}
            />
          )}
        </>
      )}
    </div>
  );
}
