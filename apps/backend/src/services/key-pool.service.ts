import type Database from 'better-sqlite3';

import { getDb } from '../db';

export interface GrabKeyResult {
  code: string;
  alreadyFulfilled: boolean;
}

export function getFulfillmentKey(orderId: string, db: Database.Database = getDb()): string | null {
  const row = db.prepare(`
    SELECT key_code
    FROM fulfillments
    WHERE order_id = ?
  `).get(orderId) as { key_code: string } | undefined;

  return row?.key_code ?? null;
}

export function grabKeyForOrder(orderId: string, db: Database.Database = getDb()): GrabKeyResult | null {
  const existing = getFulfillmentKey(orderId, db);
  if (existing) {
    return { code: existing, alreadyFulfilled: true };
  }

  const available = db.prepare(`
    SELECT code
    FROM key_pool
    WHERE status = 'available'
    LIMIT 1
  `).get() as { code: string } | undefined;

  if (!available) {
    return null;
  }

  const now = new Date().toISOString();
  const issue = db.prepare(`
    UPDATE key_pool
    SET status = 'issued', order_id = ?, issued_at = ?
    WHERE code = ? AND status = 'available'
  `).run(orderId, now, available.code);

  if (issue.changes === 0) {
    return grabKeyForOrder(orderId, db);
  }

  try {
    db.prepare(`
      INSERT INTO fulfillments (order_id, key_code, fulfilled_at)
      VALUES (?, ?, ?)
    `).run(orderId, available.code, now);
  } catch {
    const raced = getFulfillmentKey(orderId, db);
    if (raced) {
      return { code: raced, alreadyFulfilled: true };
    }
    throw new Error('Failed to record fulfillment');
  }

  return { code: available.code, alreadyFulfilled: false };
}

export function runImmediate<T>(fn: (db: Database.Database) => T): T {
  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    const result = fn(db);
    db.prepare('COMMIT').run();
    return result;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}
