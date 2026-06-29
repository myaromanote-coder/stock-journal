import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM watchlist ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { ticker, name, market, target_price, memo } = req.body;
  if (!ticker || !name || !market) {
    return res.status(400).json({ error: '필수 항목이 누락됐습니다.' });
  }
  try {
    const result = db.prepare(`
      INSERT INTO watchlist (ticker, name, market, target_price, memo)
      VALUES (?, ?, ?, ?, ?)
    `).run(ticker.toUpperCase(), name, market, target_price || null, memo || null);
    const row = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(row);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '이미 관심종목에 추가된 주식입니다.' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', (req, res) => {
  const { target_price, memo } = req.body;
  const result = db.prepare(`
    UPDATE watchlist SET target_price=?, memo=? WHERE id=?
  `).run(target_price || null, memo || null, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  const row = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(req.params.id);
  res.json(row);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM watchlist WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ success: true });
});

export default router;
