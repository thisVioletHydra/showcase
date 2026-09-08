import type Database from 'better-sqlite3';

function tableColumns(db: Database.Database, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return new Set(rows.map((row) => row.name));
}

function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
): void {
  const columns = tableColumns(db, table);
  if (columns.has(column)) {
    return;
  }

  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      sku TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT NOT NULL,
      image TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS key_pool (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'available',
      order_id TEXT,
      issued_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      status TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      key_code TEXT,
      promocode TEXT,
      buyer_id TEXT,
      held_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_events (
      event_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      processed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS webhook_inbox (
      event_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      payload TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS fulfillments (
      order_id TEXT PRIMARY KEY,
      key_code TEXT NOT NULL UNIQUE,
      fulfilled_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS issue_requests (
      request_id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      code TEXT,
      supplier TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promocodes (
      code TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      currency TEXT,
      max_uses INTEGER NOT NULL,
      used_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS promo_redemptions (
      code TEXT NOT NULL,
      order_id TEXT NOT NULL,
      UNIQUE(code, order_id)
    );

    CREATE TABLE IF NOT EXISTS inventory_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'available',
      order_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reservations (
      order_id TEXT PRIMARY KEY,
      sku TEXT NOT NULL,
      unit_id INTEGER NOT NULL,
      buyer_id TEXT NOT NULL,
      status TEXT NOT NULL,
      held_until TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_buyer_sku ON orders(buyer_id, sku);
    CREATE INDEX IF NOT EXISTS idx_key_pool_status ON key_pool(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_inbox_processed ON webhook_inbox(processed);
    CREATE INDEX IF NOT EXISTS idx_issue_requests_order ON issue_requests(order_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_units_sku_status ON inventory_units(sku, status);
    CREATE INDEX IF NOT EXISTS idx_inventory_units_order ON inventory_units(order_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_buyer_sku ON reservations(buyer_id, sku, status);
    CREATE INDEX IF NOT EXISTS idx_reservations_held_until ON reservations(held_until);
    CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_buyer_sku_held
      ON reservations(buyer_id, sku) WHERE status = 'held';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_unit_active
      ON reservations(unit_id) WHERE status IN ('held', 'captured');
  `);

  addColumnIfMissing(db, 'orders', 'buyer_id', 'TEXT');
  addColumnIfMissing(db, 'orders', 'held_until', 'TEXT');
}
