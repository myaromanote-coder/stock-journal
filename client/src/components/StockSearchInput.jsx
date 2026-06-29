import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function StockSearchInput({ onSelect, placeholder = '종목 검색...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (stock) => {
    const ticker = stock.symbol.replace(/\.(KS|KQ)$/, '');
    onSelect({ ticker, name: stock.name, market: stock.market });
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>
      {(results.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          {loading && <div className="px-3 py-2 text-xs text-gray-400">검색 중...</div>}
          {results.map(r => (
            <button
              key={r.symbol}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-700 text-left transition-colors"
            >
              <div>
                <span className="text-sm text-white">{r.name}</span>
                <span className="text-xs text-gray-400 ml-2">{r.symbol}</span>
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                r.market === 'US' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'
              }`}>
                {r.market === 'US' ? 'US' : r.market === 'KS' ? 'KOSPI' : 'KOSDAQ'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
