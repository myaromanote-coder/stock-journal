import { Router } from 'express';
import db from '../db.js';
import { generateMorningReport } from '../services/schedulerService.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(rows);
});

router.get('/unread-count', (req, res) => {
  const row = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get();
  res.json({ count: row.count });
});

router.post('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM notifications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// 테스트용: 즉시 모닝 리포트 생성
router.post('/generate-report', async (req, res) => {
  try {
    await generateMorningReport();
    res.json({ success: true, message: '리포트가 생성됐습니다.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
