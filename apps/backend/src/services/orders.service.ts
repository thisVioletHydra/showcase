import type Database from 'better-sqlite3';

import { getDb } from '../db';
import type { Order, OrderRow, OrderStatus } from '../types';

const ORDER_COLUMNS = `
  id, sku, status, amount, currency, key_code, promocode, created_at, updated_at, held_until
`;

export function generateOrderId(): string {
  return `ord_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function generateBuyerId(): string {
  return `buy_${crypto.randomUUID().replaceAll('-', '')}`;
}

export function mapOrder(row: OrderRow): Order {
  return {
    ...row,
    held_until: row.held_until ?? null,
  };
}

export function getOrderById(orderId: string, db: Database.Database = getDb()): Order | undefined {
  const row = db.prepare(`
    SELECT ${ORDER_COLUMNS}
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
  buyerId?: string | null;
  heldUntil?: string | null;
}): Order {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO orders (
      id, sku, status, amount, currency, key_code, promocode, buyer_id, held_until, created_at, updated_at
    )
    VALUES (?, ?, 'created', ?, ?, NULL, ?, ?, ?, ?, ?)
  `).run(
    input.id,
    input.sku,
    input.amount,
    input.currency,
    input.promocode,
    input.buyerId ?? null,
    input.heldUntil ?? null,
    now,
    now,
  );

  return getOrderById(input.id, db)!;
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

export function clearOrderHold(orderId: string, db: Database.Database = getDb()): void {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE orders
    SET held_until = NULL, updated_at = ?
    WHERE id = ?
  `).run(now, orderId);
}

export function listOrdersByStatus(statusFilter?: string): Order[] {
  const db = getDb();

  if (!statusFilter) {
    const rows = db.prepare(`
      SELECT ${ORDER_COLUMNS}
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
    SELECT ${ORDER_COLUMNS}
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

export function getOrderBuyerId(orderId: string, db: Database.Database = getDb()): string | null {
  const row = db.prepare(`
    SELECT buyer_id
    FROM orders
    WHERE id = ?
  `).get(orderId) as { buyer_id: string | null } | undefined;

  return row?.buyer_id ?? null;
}
