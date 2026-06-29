import { useState } from 'react';
import { Plus, Trash2, Star, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { useApi, apiPost, apiDelete } from '../hooks/useApi.js';
import StockSearchInput from '../components/StockSearchInput.jsx';
import StockChart from '../components/StockChart.jsx';

const MARKETS = [
  { value: 'KS', label: 'KOSPI' },
  { value: 'KQ', label: 'KOSDAQ' },
  { value: 'US', label: '미국' },
];

const emptyForm = { ticker: '', name: '', market: 'KS', target_price: '', memo: '' };

export default function Watchlist() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);

  const { data: watchlist, loading, refetch } = useApi('/api/watchlist');

  const items = watchlist || [];
  const queryStr = items.length
    ? `?items=${encodeURIComponent(JSON.stringify(items.map(w => ({ ticker: w.ticker, market: w.market }))))}`
    : null;

  const { data: quotes, loading: quotesLoading, refetch: refetchQuotes } = useApi(
    queryStr ? `/api/stocks/quotes${queryStr}` : null,
    { interval: 60000 }
  );

  const quoteMap = {};
  (quotes || []).forEach(q => { quoteMap[`${q.ticker}-${q.market}`] = q; });

  const handleSearchSelect = ({ ticker, name, market }) => {
    setForm(f => ({ ...f, ticker, name, market }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiPost('/api/watchlist', {
        ...form,
        target_price: form.target_price ? parseFloat(form.target_price) : null,
      });
      setForm(emptyForm);
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('관심 종목에서 삭제하시겠습니까?')) return;
    await apiDelete(`/api/watchlist/${id}`);
    refetch();
  };

  const formatPrice = (price, currency) => {
    if (!price) return '-';
    if (currency === 'KRW') return `${price.toLocaleString('ko-KR')}원`;
    return `$${price.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">관심 종목</h2>
        <div className="flex gap-2">
          <button
            onClick={refetchQuotes}
            disabled={quotesLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={quotesLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
          >
            <Plus size={14} />
            종목 추가
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <h3 className="font-semibold text-white">관심 종목 추가</h3>

          <div>
            <label className="block text-xs text-gray-400 mb-1">종목 검색</label>
            <StockSearchInput onSelect={handleSearchSelect} placeholder="종목명 또는 티커 검색..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">티커 <span className="text-red-400">*</span></label>
              <input
                value={form.ticker}
                onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))}
                placeholder="AAPL"
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">종목명 <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Apple Inc."
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">시장 <span className="text-red-400">*</span></label>
              <select
                value={form.market}
                onChange={e => setForm(f => ({ ...f, market: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {MARKETS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">목표 단가 (선택)</label>
              <input
                type="number"
                value={form.target_price}
                onChange={e => setForm(f => ({ ...f, target_price: e.target.value }))}
                placeholder="100000"
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">메모 (선택)</label>
              <input
                value={form.memo}
                onChange={e => setForm(f => ({ ...f, memo: e.target.value }))}
                placeholder="관심 이유..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm(emptyForm); setError(''); }}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">불러오는 중...</div>
      ) : !items.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Star size={40} className="mb-3 opacity-30" />
          <p>관심 종목이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(w => {
            const q = quoteMap[`${w.ticker}-${w.market}`];
            const up = q?.changePercent >= 0;
            const isSelected = selectedStock?.ticker === w.ticker && selectedStock?.market === w.market;

            return (
              <div
                key={w.id}
                className={`bg-gray-900 rounded-xl border transition-all overflow-hidden ${
                  isSelected ? 'border-indigo-500' : 'border-gray-800'
                }`}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-800/30"
                  onClick={() => setSelectedStock(isSelected ? null : { ticker: w.ticker, market: w.market, name: w.name })}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-semibold text-white">{w.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{w.ticker}</span>
                      <span className={`text-xs ml-2 px-1.5 py-0.5 rounded ${
                        w.market === 'US' ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'
                      }`}>
                        {w.market === 'US' ? 'US' : w.market === 'KS' ? 'KOSPI' : 'KOSDAQ'}
                      </span>
                    </div>
                    {w.memo && <span className="text-xs text-gray-500 hidden sm:block">· {w.memo}</span>}
                  </div>

                  <div className="flex items-center gap-6">
                    {q && !q.error ? (
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatPrice(q.price, q.currency)}
                        </p>
                        <div className={`flex items-center gap-1 text-sm justify-end ${up ? 'text-red-400' : 'text-blue-400'}`}>
                          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {q.changePercent != null ? `${up ? '+' : ''}${q.changePercent.toFixed(2)}%` : '-'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="text-gray-600 text-sm">{quotesLoading ? '로딩 중...' : '-'}</p>
                      </div>
                    )}

                    {w.target_price && (
                      <div className="text-right hidden md:block">
                        <p className="text-xs text-gray-500">목표가</p>
                        <p className="text-sm text-yellow-400">{formatPrice(w.target_price, w.market === 'US' ? 'USD' : 'KRW')}</p>
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); remove(w.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isSelected && (
                  <div className="border-t border-gray-800 p-4">
                    <StockChart ticker={w.ticker} market={w.market} name={w.name} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
