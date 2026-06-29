import { Router } from 'express';
import db from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM watchlist ORDER BY created_at DESC');
  res.json(result.rows);
});

router.post('/', async (req, res) => {
  const { ticker, name, market, target_price, memo } = req.body;
  if (!ticker || !name || !market) {
    return res.status(400).json({ error: '필수 항목이 누락됐습니다.' });
  }
  try {
    const result = await db.execute({
      sql: 'INSERT INTO watchlist (ticker, name, market, target_price, memo) VALUES (?, ?, ?, ?, ?)',
      args: [ticker.toUpperCase(), name, market, target_price || null, memo || null],
    });
    const row = await db.execute({ sql: 'SELECT * FROM watchlist WHERE id = ?', args: [result.lastInsertRowid] });
    res.status(201).json(row.rows[0]);
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: '이미 관심종목에 추가된 주식입니다.' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  const { target_price, memo } = req.body;
  const result = await db.execute({
    sql: 'UPDATE watchlist SET target_price=?, memo=? WHERE id=?',
    args: [target_price || null, memo || null, req.params.id],
  });
  if (result.rowsAffected === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  const row = await db.execute({ sql: 'SELECT * FROM watchlist WHERE id = ?', args: [req.params.id] });
  res.json(row.rows[0]);
});

router.delete('/:id', async (req, res) => {
  const result = await db.execute({ sql: 'DELETE FROM watchlist WHERE id = ?', args: [req.params.id] });
  if (result.rowsAffected === 0) return res.status(404).json({ error: '항목을 찾을 수 없습니다.' });
  res.json({ success: true });
});

export default router;
