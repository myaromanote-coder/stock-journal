import { useEffect, useRef, useState } from 'react';

const INTERVALS = [
  { label: '1일', value: '1D' },
  { label: '1주', value: '1W' },
  { label: '1개월', value: '1M' },
  { label: '3개월', value: '3M' },
  { label: '6개월', value: '6M' },
  { label: '1년', value: '12M' },
];

function buildTvSymbol(ticker, market) {
  if (market === 'KS') return `KRX:${ticker}`;
  if (market === 'KQ') return `KOSDAQ:${ticker}`;
  return ticker;
}

export default function StockChart({ ticker, market, name }) {
  const containerRef = useRef(null);
  const [range, setRange] = useState('6M');

  useEffect(() => {
    if (!containerRef.current || !ticker) return;
    containerRef.current.innerHTML = '';

    const symbol = buildTvSymbol(ticker, market);
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      interval: 'D',
      range,
      theme: 'dark',
      style: '1',
      locale: 'kr',
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      height: 400,
      backgroundColor: 'rgba(3, 7, 18, 1)',
      gridColor: 'rgba(31, 41, 55, 1)',
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [ticker, market, range]);

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-white">{name} 차트</span>
        <div className="flex gap-1">
          {INTERVALS.map(p => (
            <button
              key={p.value}
              onClick={() => setRange(p.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                range === p.value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="tradingview-widget-container w-full"
        style={{ height: 400 }}
      />
    </div>
  );
}
