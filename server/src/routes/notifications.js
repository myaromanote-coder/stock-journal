import { Router } from 'express';
import db from '../db.js';
import { generateMorningReport } from '../services/schedulerService.js';

const router = Router();

router.get('/', async (req, res) => {
  const result = await db.execute('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50');
  res.json(result.rows);
});

router.get('/unread-count', async (req, res) => {
  const result = await db.execute('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0');
  res.json({ count: result.rows[0].count });
});

router.post('/:id/read', async (req, res) => {
  await db.execute({ sql: 'UPDATE notifications SET is_read = 1 WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

router.post('/read-all', async (req, res) => {
  await db.execute('UPDATE notifications SET is_read = 1');
  res.json({ success: true });
});

router.delete('/:id', async (req, res) => {
  await db.execute({ sql: 'DELETE FROM notifications WHERE id = ?', args: [req.params.id] });
  res.json({ success: true });
});

router.post('/generate-report', async (req, res) => {
  try {
    await generateMorningReport();
    res.json({ success: true, message: '리포트가 생성됐습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
