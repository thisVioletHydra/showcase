import type Database from 'better-sqlite3';

import { getDb } from '../db';
import type { Order, OrderRow, OrderStatus } from '../types';

export function generateOrderId(): string {
  return `ord_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function mapOrder(row: OrderRow): Order {
  return { ...row };
}

export function getOrderById(orderId: string): Order | undefined {
  const db = getDb();
  const row = db.prepare(`
    SELECT id, sku, status, amount, currency, key_code, promocode, created_at, updated_at
    FROM orders
    WHERE id = ?
  `).get(orderId) as OrderRow | undefined;

  return row ? mapOrder(row) : undefined;
}

export function createOrderRecord(input: {
  id: string;
  sku: string;
  amount: number;
  currency: string;
  promocode: string | null;
}): Order {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO orders (id, sku, status, amount, currency, key_code, promocode, created_at, updated_at)
    VALUES (?, ?, 'created', ?, ?, NULL, ?, ?, ?)
  `).run(input.id, input.sku, input.amount, input.currency, input.promocode, now, now);

  return getOrderById(input.id)!;
}

export function transitionOrderStatus(
  orderId: string,
  fromStatus: OrderStatus | OrderStatus[],
  toStatus: OrderStatus,
  db: Database.Database = getDb(),
): boolean {
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

export function listOrdersByStatus(statusFilter?: string): Order[] {
  const db = getDb();

  if (!statusFilter) {
    const rows = db.prepare(`
      SELECT id, sku, status, amount, currency, key_code, promocode, created_at, updated_at
      FROM orders
      ORDER BY created_at DESC
    `).all() as OrderRow[];

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
  `).all(...statuses) as OrderRow[];

  return rows.map(mapOrder);
}

export function setOrderKey(orderId: string, keyCode: string, db: Database.Database = getDb()): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders
    SET key_code = ?, status = 'delivered', updated_at = ?
    WHERE id = ?
  `).run(keyCode, now, orderId);
}

export function updateOrderAmount(
  orderId: string,
  amount: number,
  promocode: string,
  db: Database.Database = getDb(),
): boolean {
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE orders
    SET amount = ?, promocode = ?, updated_at = ?
    WHERE id = ? AND status = 'created' AND promocode IS NULL
  `).run(amount, promocode, now, orderId);

  return result.changes > 0;
}
