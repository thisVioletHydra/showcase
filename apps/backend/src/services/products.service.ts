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

export function listCatalogProducts(db: Database.Database = getDb()): Array<Product & { available: number }> {
  return db.prepare(`
    SELECT
      products.sku AS sku,
      products.name AS name,
      products.type AS type,
      products.price AS price,
      products.currency AS currency,
      products.image AS image,
      COALESCE(stock.available, 0) AS available
    FROM products
    LEFT JOIN (
      SELECT sku, COUNT(*) AS available
      FROM inventory_units
      WHERE status = 'available'
      GROUP BY sku
    ) AS stock ON stock.sku = products.sku
    ORDER BY products.sku
  `).all() as Array<Product & { available: number }>;
}

export function updateProductPrice(sku: string, price: number, db: Database.Database = getDb()): boolean {
  const result = db.prepare(`
    UPDATE products
    SET price = ?
    WHERE sku = ?
  `).run(price, sku);

  return result.changes > 0;
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
