export function initSchema(db) {
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

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_key_pool_status ON key_pool(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_inbox_processed ON webhook_inbox(processed);
    CREATE INDEX IF NOT EXISTS idx_issue_requests_order ON issue_requests(order_id);
  `);
}
