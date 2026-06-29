import { Router } from 'express';
import { getQuote, getQuotes, searchStock, buildTradingViewSymbol } from '../services/stockService.js';

const router = Router();

router.get('/quote', async (req, res) => {
  const { ticker, market } = req.query;
  if (!ticker || !market) return res.status(400).json({ error: 'ticker, market 파라미터 필요' });
  try {
    res.json(await getQuote(ticker, market));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/quotes', async (req, res) => {
  const { items } = req.query;
  if (!items) return res.json([]);
  try {
    res.json(await getQuotes(JSON.parse(items)));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);
  try {
    res.json(await searchStock(q));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/tv-symbol', (req, res) => {
  const { ticker, market } = req.query;
  if (!ticker || !market) return res.status(400).json({ error: 'ticker, market 파라미터 필요' });
  res.json({ symbol: buildTradingViewSymbol(ticker, market) });
});

export default router;
