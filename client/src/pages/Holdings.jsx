import { useState } from 'react';
import { Plus, Trash2, BookOpen, ChevronDown } from 'lucide-react';
import { useApi, apiPost, apiDelete } from '../hooks/useApi.js';
import StockSearchInput from '../components/StockSearchInput.jsx';
import StockChart from '../components/StockChart.jsx';

const MARKETS = [
  { value: 'KS', label: 'KOSPI' },
  { value: 'KQ', label: 'KOSDAQ' },
  { value: 'US', label: '미국' },
];

const emptyForm = {
  ticker: '', name: '', market: 'KS',
  purchase_price: '', quantity: '', reason: '', purchase_date: '',
};

export default function Holdings() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);

  const { data: holdings, loading, refetch } = useApi('/api/holdings');

  const grouped = (holdings || []).reduce((acc, h) => {
    const key = `${h.ticker}-${h.market}`;
    if (!acc[key]) acc[key] = { ticker: h.ticker, name: h.name, market: h.market, items: [] };
    acc[key].items.push(h);
    return acc;
  }, {});

  const handleSearchSelect = ({ ticker, name, market }) => {
    setForm(f => ({ ...f, ticker, name, market }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiPost('/api/holdings', {
        ...form,
        purchase_price: parseFloat(form.purchase_price),
        quantity: parseFloat(form.quantity),
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
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    await apiDelete(`/api/holdings/${id}`);
    refetch();
  };

  const totalValue = (items) => {
    return items.reduce((sum, h) => sum + h.purchase_price * h.quantity, 0);
  };

  const formatPrice = (price, market) => {
    if (market === 'US') return `$${price.toFixed(2)}`;
    return `${price.toLocaleString('ko-KR')}원`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">매수 이력</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          <Plus size={14} />
          매수 기록 추가
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-gray-900 rounded-xl p-5 border border-gray-800 space-y-4">
          <h3 className="font-semibold text-white">새 매수 기록</h3>

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
                placeholder="005930"
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">종목명 <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="삼성전자"
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">매수 단가 <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={form.purchase_price}
                onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))}
                placeholder="75000"
                required
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">수량 <span className="text-red-400">*</span></label>
              <input
                type="number"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="10"
                required
                min="0"
                step="any"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">매수일 <span className="text-red-400">*</span></label>
              <input
                type="date"
                value={form.purchase_date}
                onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">매수 이유</label>
            <textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="매수한 이유, 투자 thesis 등을 기록하세요..."
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
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
      ) : !Object.keys(grouped).length ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <BookOpen size={40} className="mb-3 opacity-30" />
          <p>매수 기록이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped).map(([key, group]) => {
            const total = totalValue(group.items);
            const isOpen = expandedGroup === key;
            return (
              <div key={key} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors"
                  onClick={() => {
                    setExpandedGroup(isOpen ? null : key);
                    setSelectedStock(isOpen ? null : { ticker: group.ticker, market: group.market, name: group.name });
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm truncate">{group.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-500">{group.ticker}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          group.market === 'US' ? 'bg-blue-900/50 text-blue-300' : 'bg-orange-900/50 text-orange-300'
                        }`}>
                          {group.market === 'US' ? 'US' : group.market === 'KS' ? 'KOSPI' : 'KOSDAQ'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-xs text-gray-500 whitespace-nowrap">{group.items.length}건 · 총 매수금액</p>
                      <p className="text-white font-medium text-sm whitespace-nowrap">{formatPrice(total, group.market)}</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-800">
                    {group.items.map(h => (
                      <div key={h.id} className="flex items-start justify-between px-5 py-3 border-b border-gray-800/50 last:border-0">
                        <div className="space-y-1">
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-400">{h.purchase_date}</span>
                            <span className="text-white">{formatPrice(h.purchase_price, h.market)}</span>
                            <span className="text-gray-400">× {h.quantity}주</span>
                            <span className="text-indigo-300 font-medium">{formatPrice(h.purchase_price * h.quantity, h.market)}</span>
                          </div>
                          {h.reason && (
                            <p className="text-xs text-gray-500 max-w-xl whitespace-pre-wrap">{h.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => remove(h.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors ml-4 flex-shrink-0 mt-0.5"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {selectedStock && selectedStock.ticker === group.ticker && (
                      <div className="p-4">
                        <StockChart ticker={group.ticker} market={group.market} name={group.name} />
                      </div>
                    )}
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
