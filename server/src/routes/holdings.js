import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM holdings ORDER BY purchase_date DESC, created_at DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { ticker, name, market, purchase_price, quantity, reason, purchase_date } = req.body;
  if (!ticker || !name || !market || !purchase_price || !quantity || !purchase_date) {
    return res.status(400).json({ error: '필수 항목이 누락됐습니다.' });
  }
  const result = await db.execute({
    sql: 'INSERT INTO holdings (ticker, name, market, purchase_price, quantity, reason, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [ticker.toUpperCase(), name, market, purchase_price, quantity, reason || null, purchase_date],
  });
  const row = await db.execute({ sql: 'SELECT * FROM holdings WHERE id = ?', args: [result.lastInsertRowid] });
  res.status(201).json(row.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM holdings WHERE id = ?', args: [req.params.id] });
  if (result.rowsAffected === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ success: true });
});

router.put('/:id', async (req, res) => {
  const { ticker, name, market, purchase_price, quantity, reason, purchase_date } = req.body;
  const result = await db.execute({
    sql: 'UPDATE holdings SET ticker=?, name=?, market=?, purchase_price=?, quantity=?, reason=?, purchase_date=? WHERE id=?',
    args: [ticker?.toUpperCase(), name, market, purchase_price, quantity, reason || null, purchase_date, req.params.id],
  });
  if (result.rowsAffected === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  const row = await db.execute({ sql: 'SELECT * FROM holdings WHERE id = ?', args: [req.params.id] });
  res.json(row.rows[0]);
});

export default router;
