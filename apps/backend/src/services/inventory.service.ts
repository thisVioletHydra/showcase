import type Database from 'better-sqlite3';

import { config } from '../config';
import { getDb } from '../db';
import type { Order, Product } from '../types';
import {
  clearOrderHold,
  createOrderRecord,
  generateOrderId,
  getOrderBuyerId,
  getOrderById,
  transitionOrderStatus,
} from './orders.service';
import { getProductBySku, listCatalogProducts } from './products.service';
import { applyPromocode, calculateDiscountedPrice } from './promocodes.service';

interface ReservationRow {
  order_id: string;
  sku: string;
  unit_id: number;
  buyer_id: string;
  status: 'held' | 'captured' | 'released';
  held_until: string;
}

export interface ClaimOrderInput {
  sku: string;
  amount: number;
  currency: string;
  promocodeCode?: string;
  buyerId: string;
  orderId?: string;
}

export type ClaimOrderResult =
  | { ok: true; order: Order; created: boolean }
  | { ok: false; reason: 'sold_out'; neighbor: Product | null };

let afterInventoryChange: (() => void) | null = null;

export function onInventoryChange(listener: () => void): void {
  afterInventoryChange = listener;
}

function emitInventoryChange(): void {
  if (getDb().inTransaction) {
    return;
  }

  afterInventoryChange?.();
}

function nowIso(): string {
  return new Date().toISOString();
}

function holdUntilIso(): string {
  return new Date(Date.now() + config.reservationHoldMs).toISOString();
}

export function findNeighborProduct(sku: string): Product | null {
  const products = listCatalogProducts();
  if (products.length === 0) {
    return null;
  }

  const index = products.findIndex((item) => item.sku === sku);
  const current = index >= 0 ? products[index] : getProductBySku(sku);

  if (current) {
    const sameType = products
      .map((item, pos) => ({ item, pos }))
      .filter((entry) => entry.item.type === current.type && entry.item.sku !== sku);

    if (sameType.length > 0) {
      const origin = index >= 0 ? index : 0;
      sameType.sort((left, right) => Math.abs(left.pos - origin) - Math.abs(right.pos - origin));
      return sameType[0]?.item ?? null;
    }
  }

  if (index < 0) {
    return products.find((item) => item.sku !== sku) ?? null;
  }

  const next = products[index + 1];
  if (next && next.sku !== sku) {
    return next;
  }

  const prev = products[index - 1];
  if (prev && prev.sku !== sku) {
    return prev;
  }

  return products.find((item) => item.sku !== sku) ?? null;
}

export function expireStaleReservations(db: Database.Database = getDb()): number {
  const startedHere = !db.inTransaction;
  if (startedHere) {
    db.prepare('BEGIN IMMEDIATE').run();
  }

  try {
    const now = nowIso();
    const stale = db.prepare(`
      SELECT order_id
      FROM reservations
      WHERE status = 'held' AND held_until <= ?
    `).all(now) as Array<{ order_id: string }>;

    for (const row of stale) {
      releaseHold(row.order_id, 'expired', db);
    }

    if (startedHere) {
      db.prepare('COMMIT').run();
    }

    if (startedHere && stale.length > 0) {
      emitInventoryChange();
    }

    return stale.length;
  } catch (error) {
    if (startedHere) {
      db.prepare('ROLLBACK').run();
    }
    throw error;
  }
}

function getHeldReservation(
  db: Database.Database,
  buyerId: string,
  sku: string,
): ReservationRow | undefined {
  return db.prepare(`
    SELECT order_id, sku, unit_id, buyer_id, status, held_until
    FROM reservations
    WHERE buyer_id = ? AND sku = ? AND status = 'held'
    LIMIT 1
  `).get(buyerId, sku) as ReservationRow | undefined;
}

function getReservationByOrder(
  db: Database.Database,
  orderId: string,
): ReservationRow | undefined {
  return db.prepare(`
    SELECT order_id, sku, unit_id, buyer_id, status, held_until
    FROM reservations
    WHERE order_id = ?
  `).get(orderId) as ReservationRow | undefined;
}

function claimAvailableUnit(db: Database.Database, sku: string, orderId: string): number | null {
  const now = nowIso();
  const result = db.prepare(`
    UPDATE inventory_units
    SET status = 'held', order_id = ?, updated_at = ?
    WHERE id = (
      SELECT id
      FROM inventory_units
      WHERE sku = ? AND status = 'available'
      LIMIT 1
    ) AND status = 'available'
  `).run(orderId, now, sku);

  if (result.changes === 0) {
    return null;
  }

  const row = db.prepare(`
    SELECT id
    FROM inventory_units
    WHERE order_id = ? AND status = 'held'
    LIMIT 1
  `).get(orderId) as { id: number } | undefined;

  return row?.id ?? null;
}

export function releaseHold(
  orderId: string,
  nextOrderStatus: 'expired' | null,
  db: Database.Database = getDb(),
): void {
  const now = nowIso();
  const reservation = getReservationByOrder(db, orderId);
  if (!reservation || reservation.status !== 'held') {
    return;
  }

  db.prepare(`
    UPDATE inventory_units
    SET status = 'available', order_id = NULL, updated_at = ?
    WHERE id = ? AND status = 'held'
  `).run(now, reservation.unit_id);

  db.prepare(`
    UPDATE reservations
    SET status = 'released', updated_at = ?
    WHERE order_id = ? AND status = 'held'
  `).run(now, orderId);

  if (nextOrderStatus === 'expired') {
    transitionOrderStatus(orderId, 'created', 'expired', db);
    clearOrderHold(orderId, db);
  }

  emitInventoryChange();
}

export function captureHold(orderId: string, db: Database.Database = getDb()): boolean {
  const reservation = getReservationByOrder(db, orderId);
  if (!reservation) {
    return false;
  }

  if (reservation.status === 'captured') {
    return true;
  }

  if (reservation.status !== 'held') {
    return false;
  }

  const now = nowIso();
  const unit = db.prepare(`
    UPDATE inventory_units
    SET status = 'sold', updated_at = ?
    WHERE id = ? AND status = 'held'
  `).run(now, reservation.unit_id);

  if (unit.changes === 0) {
    return false;
  }

  db.prepare(`
    UPDATE reservations
    SET status = 'captured', updated_at = ?
    WHERE order_id = ? AND status = 'held'
  `).run(now, orderId);

  clearOrderHold(orderId, db);
  return true;
}

function reuseOrder(db: Database.Database, input: ClaimOrderInput): Order | undefined {
  if (!input.orderId) {
    return undefined;
  }

  const order = getOrderById(input.orderId, db);
  if (!order || order.status !== 'created' || order.sku !== input.sku) {
    return undefined;
  }

  const owner = getOrderBuyerId(input.orderId, db);
  if (owner !== input.buyerId) {
    return undefined;
  }

  const reservation = getReservationByOrder(db, input.orderId);
  if (!reservation || reservation.status !== 'held') {
    return undefined;
  }

  return order;
}

function paidStatuses(status: Order['status']): boolean {
  return status === 'paid' || status === 'delivering' || status === 'delivered';
}

export function claimOrder(input: ClaimOrderInput): ClaimOrderResult {
  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    expireStaleReservations(db);

    const hinted = reuseOrder(db, input);
    if (hinted) {
      db.prepare('COMMIT').run();
      emitInventoryChange();
      return { ok: true, order: hinted, created: false };
    }

    const active = getHeldReservation(db, input.buyerId, input.sku);
    if (active) {
      const current = getOrderById(active.order_id, db);
      if (current && current.status === 'created') {
        db.prepare('COMMIT').run();
        emitInventoryChange();
        return { ok: true, order: current, created: false };
      }

      if (current && paidStatuses(current.status)) {
        captureHold(active.order_id, db);
      } else {
        releaseHold(active.order_id, null, db);
      }
    }

    const orderId = generateOrderId();
    const unitId = claimAvailableUnit(db, input.sku, orderId);
    if (unitId === null) {
      db.prepare('COMMIT').run();
      emitInventoryChange();
      return { ok: false, reason: 'sold_out', neighbor: findNeighborProduct(input.sku) };
    }

    let finalAmount = input.amount;
    let promocodeValue: string | null = null;

    if (input.promocodeCode) {
      const promo = applyPromocode(orderId, input.promocodeCode);
      promocodeValue = promo.code;
      finalAmount = calculateDiscountedPrice(input.amount, input.currency, promo);
    }

    const heldUntil = holdUntilIso();
    const now = nowIso();
    const order = createOrderRecord({
      id: orderId,
      sku: input.sku,
      amount: finalAmount,
      currency: input.currency,
      promocode: promocodeValue,
      buyerId: input.buyerId,
      heldUntil,
    });

    db.prepare(`
      INSERT INTO reservations (
        order_id, sku, unit_id, buyer_id, status, held_until, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, 'held', ?, ?, ?)
    `).run(orderId, input.sku, unitId, input.buyerId, heldUntil, now, now);

    db.prepare('COMMIT').run();
    emitInventoryChange();
    return { ok: true, order, created: true };
  } catch (error) {
    if (db.inTransaction) {
      db.prepare('ROLLBACK').run();
    }
    throw error;
  }
}

export function countAvailableUnits(sku: string, db: Database.Database = getDb()): number {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM inventory_units
    WHERE sku = ? AND status = 'available'
  `).get(sku) as { count: number };

  return row.count;
}

export function setAvailableCount(sku: string, target: number): number {
  if (!Number.isInteger(target) || target < 0) {
    throw new Error('available must be a non-negative integer');
  }

  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    expireStaleReservations(db);
    const now = nowIso();
    let current = countAvailableUnits(sku, db);

    if (current > target) {
      const extra = current - target;
      db.prepare(`
        DELETE FROM inventory_units
        WHERE id IN (
          SELECT id
          FROM inventory_units
          WHERE sku = ? AND status = 'available'
          LIMIT ?
        )
      `).run(sku, extra);
    } else if (current < target) {
      const insert = db.prepare(`
        INSERT INTO inventory_units (sku, status, created_at, updated_at)
        VALUES (?, 'available', ?, ?)
      `);
      const missing = target - current;
      for (let i = 0; i < missing; i += 1) {
        insert.run(sku, now, now);
      }
    }

    current = countAvailableUnits(sku, db);
    db.prepare('COMMIT').run();
    emitInventoryChange();
    return current;
  } catch (error) {
    if (db.inTransaction) {
      db.prepare('ROLLBACK').run();
    }
    throw error;
  }
}

export function resetHoldsForSku(sku: string): number {
  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    expireStaleReservations(db);
    const held = db.prepare(`
      SELECT order_id
      FROM reservations
      WHERE sku = ? AND status = 'held'
    `).all(sku) as Array<{ order_id: string }>;

    for (const row of held) {
      releaseHold(row.order_id, 'expired', db);
    }

    db.prepare('COMMIT').run();
    emitInventoryChange();
    return held.length;
  } catch (error) {
    if (db.inTransaction) {
      db.prepare('ROLLBACK').run();
    }
    throw error;
  }
}
