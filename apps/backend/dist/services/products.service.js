import { getDb } from '../db.js';
export function listProducts() {
    const db = getDb();
    return db.prepare(`
    SELECT sku, name, type, price, currency, image
    FROM products
    ORDER BY sku
  `).all();
}
export function getProductBySku(sku) {
    const db = getDb();
    return db.prepare(`
    SELECT sku, name, type, price, currency, image
    FROM products
    WHERE sku = ?
  `).get(sku);
}
export function insertKeys(codes) {
    const db = getDb();
    const insert = db.prepare(`
    INSERT OR IGNORE INTO key_pool (code, status)
    VALUES (?, 'available')
  `);
    let inserted = 0;
    const addKeys = db.transaction((items) => {
        for (const code of items) {
            const result = insert.run(code);
            inserted += result.changes;
        }
    });
    addKeys(codes);
    return inserted;
}
export function countAvailableKeys(db = getDb()) {
    const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM key_pool
    WHERE status = 'available'
  `).get();
    return row.count;
}
