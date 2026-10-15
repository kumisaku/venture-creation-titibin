import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// On a host, point DATA_DIR at a persistent volume so the database survives redeploys.
export const DATA_DIR = process.env.DATA_DIR || join(root, 'data');
export const UPLOAD_DIR = join(DATA_DIR, 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new DatabaseSync(join(DATA_DIR, 'titibin.db'));
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  nim TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  campus TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  about TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'buyer',
  rating_sum REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  jastiper_id INTEGER NOT NULL REFERENCES users(id),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  stores TEXT NOT NULL DEFAULT '',
  depart_date TEXT NOT NULL,
  return_date TEXT NOT NULL,
  capacity_kg REAL NOT NULL,
  categories TEXT NOT NULL DEFAULT '[]',
  max_budget INTEGER,
  drop_point TEXT NOT NULL DEFAULT '',
  catalog_photo TEXT,
  max_slots INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  trip_id INTEGER REFERENCES trips(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_location TEXT NOT NULL,
  store TEXT NOT NULL DEFAULT '',
  weight_kg REAL NOT NULL,
  item_price INTEGER NOT NULL,
  jastip_fee INTEGER NOT NULL,
  app_fee INTEGER NOT NULL,
  handover_point TEXT NOT NULL,
  photo TEXT,
  payment_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reject_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  photo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  order_id INTEGER PRIMARY KEY REFERENCES orders(id),
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  jastiper_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  text TEXT NOT NULL DEFAULT '',
  tip INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS app_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  text TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);
