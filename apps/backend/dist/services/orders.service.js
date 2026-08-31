import { getDb } from '../db.js';
export function generateOrderId() {
    const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 12);
    return `ord_${suffix}`;
}
export function mapOrder(row) {
    return { ...row };
}
export function getOrderById(orderId) {
    const db = getDb();
    const row = db.prepare(`
    SELECT id, sku, status, amount, currency, key_code, promocode, created_at, updated_at
    FROM orders
    WHERE id = ?
  `).get(orderId);
    return row ? mapOrder(row) : undefined;
}
export function createOrderRecord(input) {
    const db = getDb();
    const now = new Date().toISOString();
    db.prepare(`
    INSERT INTO orders (id, sku, status, amount, currency, key_code, promocode, created_at, updated_at)
    VALUES (?, ?, 'created', ?, ?, NULL, ?, ?, ?)
  `).run(input.id, input.sku, input.amount, input.currency, input.promocode, now, now);
    return getOrderById(input.id);
}
export function updateOrderStatus(orderId, status, keyCode = null, db = getDb()) {
    const now = new Date().toISOString();
    const result = db.prepare(`
    UPDATE orders
    SET status = ?, key_code = COALESCE(?, key_code), updated_at = ?
    WHERE id = ?
  `).run(status, keyCode, now, orderId);
    return result.changes > 0;
}
export function transitionOrderStatus(orderId, fromStatus, toStatus, db = getDb()) {
    const allowed = Array.isArray(fromStatus) ? fromStatus : [fromStatus];
    const placeholders = allowed.map(() => '?').join(', ');
    const now = new Date().toISOString();
    const result = db.prepare(`
    UPDATE orders
    SET status = ?, updated_at = ?
    WHERE id = ? AND status IN (${placeholders})
  `).run(toStatus, now, orderId, ...allowed);
    return result.changes > 0;
}
export function listOrdersByStatus(statusFilter) {
    const db = getDb();
    if (!statusFilter) {
        const rows = db.prepare(`
      SELECT id, sku, status, amount, currency, key_code, promocode, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
    `).all();
        return rows.map(mapOrder);
    }
    const statuses = statusFilter.split(',').map((item) => item.trim()).filter(Boolean);
    if (statuses.length === 0) {
        return [];
    }
    const placeholders = statuses.map(() => '?').join(', ');
    const rows = db.prepare(`
    SELECT id, sku, status, amount, currency, key_code, promocode, created_at, updated_at
    FROM orders
    WHERE status IN (${placeholders})
    ORDER BY created_at DESC
  `).all(...statuses);
    return rows.map(mapOrder);
}
export function setOrderKey(orderId, keyCode, db = getDb()) {
    const now = new Date().toISOString();
    db.prepare(`
    UPDATE orders
    SET key_code = ?, status = 'delivered', updated_at = ?
    WHERE id = ?
  `).run(keyCode, now, orderId);
}
export function updateOrderAmount(orderId, amount, promocode, db = getDb()) {
    const now = new Date().toISOString();
    const result = db.prepare(`
    UPDATE orders
    SET amount = ?, promocode = ?, updated_at = ?
    WHERE id = ? AND status = 'created' AND promocode IS NULL
  `).run(amount, promocode, now, orderId);
    return result.changes > 0;
}
