import type Database from 'better-sqlite3';

import { getDb } from '../db';
import type { Product } from '../types';

export function listProducts(): Product[] {
  const db = getDb();
  return db.prepare(`
    SELECT sku, name, type, price, currency, image
    FROM products
    ORDER BY sku
  `).all() as Product[];
}

export function getProductBySku(sku: string): Product | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT sku, name, type, price, currency, image
    FROM products
    WHERE sku = ?
  `).get(sku) as Product | undefined;
}

export function insertKeys(codes: string[]): number {
  const db = getDb();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO key_pool (code, status)
    VALUES (?, 'available')
  `);

  let inserted = 0;
  const addKeys = db.transaction((items: string[]) => {
    for (const code of items) {
      const result = insert.run(code);
      inserted += result.changes;
    }
  });

  addKeys(codes);
  return inserted;
}

export function countAvailableKeys(db: Database.Database = getDb()): number {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM key_pool
    WHERE status = 'available'
  `).get() as { count: number };

  return row.count;
}
