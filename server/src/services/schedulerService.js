import cron from 'node-cron';
import db from '../db.js';
import { getQuote } from './stockService.js';

export function startScheduler() {
  cron.schedule('30 9 * * 1-5', async () => {
    await generateMorningReport();
  }, { timezone: 'Asia/Seoul' });

  console.log('[Scheduler] 오전 9:30 모닝 리포트 스케줄 등록 완료 (Asia/Seoul)');
}

export async function generateMorningReport() {
  const holdings = db.prepare('SELECT DISTINCT ticker, market, name FROM holdings').all();
  const watchlist = db.prepare('SELECT ticker, market, name FROM watchlist').all();

  const allStocks = [
    ...holdings.map(h => ({ ...h, type: 'holding' })),
    ...watchlist
      .filter(w => !holdings.some(h => h.ticker === w.ticker && h.market === w.market))
      .map(w => ({ ...w, type: 'watchlist' })),
  ];

  if (allStocks.length === 0) return;

  const lines = [];
  const reportData = [];

  for (const stock of allStocks) {
    try {
      const quote = await getQuote(stock.ticker, stock.market);
      const sign = (quote.changePercent ?? 0) >= 0 ? '+' : '';
      const label = stock.type === 'holding' ? '[보유]' : '[관심]';
      const priceStr = quote.currency === 'KRW'
        ? `${Math.round(quote.price).toLocaleString('ko-KR')}원`
        : `$${quote.price?.toFixed(2)}`;
      lines.push(`${label} ${stock.name} (${stock.ticker}): ${priceStr} (${sign}${quote.changePercent?.toFixed(2)}%)`);
      reportData.push({ ...stock, quote });
    } catch {
      lines.push(`${stock.name} (${stock.ticker}): 시세 조회 실패`);
    }
  }

  const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
  db.prepare(`
    INSERT INTO notifications (type, title, message, data)
    VALUES (?, ?, ?, ?)
  `).run(
    'morning_report',
    `${today} 모닝 리포트`,
    `📊 ${today} 시장 현황\n\n${lines.join('\n')}`,
    JSON.stringify(reportData),
  );

  console.log(`[Scheduler] 모닝 리포트 생성 완료 (${allStocks.length}종목)`);
}
