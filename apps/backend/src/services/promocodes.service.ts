import { getDb } from '../db.js';
import type { Promocode, PromocodeType } from '../types.js';

export class PromocodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromocodeError';
  }
}

export function getPromocode(code: string): Promocode | undefined {
  const db = getDb();
  return db.prepare(`
    SELECT code, type, value, currency, max_uses, used_count
    FROM promocodes
    WHERE code = ?
  `).get(code) as Promocode | undefined;
}

export function calculateDiscountedPrice(
  basePrice: number,
  currency: string,
  promocode: Promocode,
): number {
  if (promocode.type === 'percent') {
    const discount = basePrice * (promocode.value / 100);
    return Math.max(0, Math.round(basePrice - discount));
  }

  if (promocode.currency && promocode.currency !== currency) {
    throw new PromocodeError('Promocode currency mismatch');
  }

  return Math.max(0, Math.round(basePrice - promocode.value));
}

export function applyPromocode(orderId: string, code: string): Promocode {
  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    const promo = getPromocode(code);
    if (!promo) {
      throw new PromocodeError('Promocode not found');
    }

    const update = db.prepare(`
      UPDATE promocodes
      SET used_count = used_count + 1
      WHERE code = ? AND used_count < max_uses
    `).run(code);

    if (update.changes === 0) {
      throw new PromocodeError('Promocode exhausted');
    }

    db.prepare(`
      INSERT INTO promo_redemptions (code, order_id)
      VALUES (?, ?)
    `).run(code, orderId);

    db.prepare('COMMIT').run();
    return getPromocode(code)!;
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }
}

export function previewPromocode(code: string, basePrice: number, currency: string): {
  promocode: Promocode;
  finalAmount: number;
} {
  const promocode = getPromocode(code);
  if (!promocode) {
    throw new PromocodeError('Promocode not found');
  }

  if (promocode.used_count >= promocode.max_uses) {
    throw new PromocodeError('Promocode exhausted');
  }

  const finalAmount = calculateDiscountedPrice(basePrice, currency, promocode);
  return { promocode, finalAmount };
}

export function isValidPromocodeType(value: string): value is PromocodeType {
  return value === 'percent' || value === 'amount';
}
