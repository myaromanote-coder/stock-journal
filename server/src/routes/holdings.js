import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM holdings ORDER BY purchase_date DESC, created_at DESC
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { ticker, name, market, purchase_price, quantity, reason, purchase_date } = req.body;
  if (!ticker || !name || !market || !purchase_price || !quantity || !purchase_date) {
    return res.status(400).json({ error: '필수 항목이 누락됐습니다.' });
  }
  const result = db.prepare(`
    INSERT INTO holdings (ticker, name, market, purchase_price, quantity, reason, purchase_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(ticker.toUpperCase(), name, market, purchase_price, quantity, reason || null, purchase_date);

  const row = db.prepare('SELECT * FROM holdings WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(row);
});

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM holdings WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ success: true });
});

router.put('/:id', (req, res) => {
  const { ticker, name, market, purchase_price, quantity, reason, purchase_date } = req.body;
  const result = db.prepare(`
    UPDATE holdings SET ticker=?, name=?, market=?, purchase_price=?, quantity=?, reason=?, purchase_date=?
    WHERE id=?
  `).run(ticker?.toUpperCase(), name, market, purchase_price, quantity, reason || null, purchase_date, req.params.id);

  if (result.changes === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  const row = db.prepare('SELECT * FROM holdings WHERE id = ?').get(req.params.id);
  res.json(row);
});

export default router;
