import type Database from 'better-sqlite3';

import { getDb } from '../db';
import type { Product, ProductType } from '../types';

const PRODUCT_TYPES = new Set<ProductType>(['topup', 'key', 'subscription', 'giftcard']);

const CATALOG_SELECT = `
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
`;

export interface CatalogSearchQuery {
  q?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export interface CatalogSearchResult {
  products: Array<Product & { available: number }>;
  total: number;
}

export function parseProductType(raw: string | undefined): ProductType | undefined {
  if (!raw) {
    return undefined;
  }

  return PRODUCT_TYPES.has(raw as ProductType) ? raw as ProductType : undefined;
}

export function sanitizeSearchNeedle(raw: string): string {
  return raw.replaceAll('%', '').replaceAll('_', '').trim();
}

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
    ${CATALOG_SELECT}
    ORDER BY products.sku
  `).all() as Array<Product & { available: number }>;
}

function clampInt(value: number | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || Number.isFinite(value) === false) {
    return fallback;
  }

  const whole = Math.trunc(value);
  if (whole < min) {
    return min;
  }

  if (whole > max) {
    return max;
  }

  return whole;
}

export function searchCatalog(
  query: CatalogSearchQuery,
  db: Database.Database = getDb(),
): CatalogSearchResult {
  const clauses: string[] = [];
  const params: Array<string> = [];
  const type = parseProductType(query.type);
  const needle = query.q ? sanitizeSearchNeedle(query.q) : '';

  if (type) {
    clauses.push('products.type = ?');
    params.push(type);
  }

  if (needle.length > 0) {
    const like = `%${needle}%`;
    clauses.push('(LOWER(products.name) LIKE LOWER(?) OR LOWER(products.sku) LIKE LOWER(?))');
    params.push(like, like);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const totalRow = db.prepare(`
    SELECT COUNT(*) AS total
    FROM products
    ${where}
  `).get(...params) as { total: number };

  const limit = clampInt(query.limit, 50, 1, 100);
  const offset = clampInt(query.offset, 0, 0, 1_000_000);
  const products = db.prepare(`
    ${CATALOG_SELECT}
    ${where}
    ORDER BY products.sku
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset) as Array<Product & { available: number }>;

  return {
    products,
    total: totalRow.total,
  };
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
