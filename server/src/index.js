import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import holdingsRouter from './routes/holdings.js';
import watchlistRouter from './routes/watchlist.js';
import stocksRouter from './routes/stocks.js';
import notificationsRouter from './routes/notifications.js';
import { startScheduler } from './services/schedulerService.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors({ origin: true }));
app.use(express.json());

app.use('/api/holdings', holdingsRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/stocks', stocksRouter);
app.use('/api/notifications', notificationsRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// 프로덕션: 빌드된 React 앱 서빙
const PUBLIC_DIR = join(__dirname, '..', 'public');
if (IS_PROD && existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get('*', (_, res) => res.sendFile(join(PUBLIC_DIR, 'index.html')));
}

startScheduler();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] http://0.0.0.0:${PORT} 에서 실행 중 (${IS_PROD ? 'production' : 'development'})`);
});
