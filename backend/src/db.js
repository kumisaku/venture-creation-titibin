import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// On a host, keep data on a persistent volume so it survives redeploys. Railway sets
// RAILWAY_VOLUME_MOUNT_PATH when a volume is attached; DATA_DIR overrides it.
export const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || join(root, 'data');
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

// Lightweight migrations for databases created before these columns existed.
function addColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
addColumn('users', 'payment_qr', 'TEXT');
addColumn('trips', 'hold_over_budget', 'INTEGER NOT NULL DEFAULT 0');
addColumn('orders', 'unit_price', 'INTEGER');
addColumn('orders', 'photos', "TEXT NOT NULL DEFAULT '[]'");
addColumn('orders', 'invoice_photo', 'TEXT');
addColumn('orders', 'payment_qr', 'TEXT');
addColumn('orders', 'invoiced_at', 'TEXT');
addColumn('orders', 'paid_at', 'TEXT');
addColumn('orders', 'completed_at', 'TEXT');
// Payment now happens after the invoice. Old 'paid' orders (not yet purchased) become 'accepted'
// with paid_at set; every other order that already has a payment method counts as paid.
export function migrateOrders() {
  db.exec(`
  UPDATE orders SET paid_at = updated_at WHERE paid_at IS NULL AND payment_method IS NOT NULL;
  UPDATE orders SET status = 'accepted' WHERE status = 'paid';
  UPDATE orders SET unit_price = item_price / quantity WHERE unit_price IS NULL;
  UPDATE orders SET completed_at = updated_at WHERE completed_at IS NULL AND status = 'completed';
  UPDATE orders SET photos = json_array(photo) WHERE photos = '[]' AND photo IS NOT NULL;
`);
}
migrateOrders();
