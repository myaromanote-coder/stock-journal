import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_URL || 'file:local.db',
  authToken: process.env.TURSO_TOKEN,
});

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS holdings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    market TEXT NOT NULL,
    purchase_price REAL NOT NULL,
    quantity REAL NOT NULL,
    reason TEXT,
    purchase_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    name TEXT NOT NULL,
    market TEXT NOT NULL,
    target_price REAL,
    memo TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    UNIQUE(ticker, market)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`);

export default db;
