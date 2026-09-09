import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { closeDb, getDb } from '../src/db';
import { seedDatabase } from '../src/seed';
import {
  claimOrder,
  setAvailableCount,
} from '../src/services/inventory.service';
import { getOrderById } from '../src/services/orders.service';

const SKU = 'KEY-CS2-PRIME';
const AMOUNT = 1290;
const CURRENCY = 'RUB';

function ordersForBuyer(buyerId: string): Array<{ id: string; sku: string }> {
  return getDb().prepare(`
    SELECT id, sku
    FROM orders
    WHERE buyer_id = ?
    ORDER BY created_at
  `).all(buyerId) as Array<{ id: string; sku: string }>;
}

describe('claim hold (stage 2)', () => {
  before(() => {
    seedDatabase(getDb());
  });

  after(() => {
    closeDb();
  });

  it('same buyer retry returns the held orderId, no second hold', () => {
    setAvailableCount(SKU, 2);
    const first = claimOrder({
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      buyerId: 'buy_retry',
    });
    assert.equal(first.ok, true);
    if (first.ok === false) {
      return;
    }

    const second = claimOrder({
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      buyerId: 'buy_retry',
    });
    assert.equal(second.ok, true);
    if (second.ok === false) {
      return;
    }

    assert.equal(second.order.id, first.order.id);
    assert.equal(second.created, false);
    assert.equal(ordersForBuyer('buy_retry').length, 1);
    assert.equal(getOrderById(first.order.id)?.sku, SKU);
  });

  it('last unit loser is refused without an order; neighbor is a product, not a hold', () => {
    setAvailableCount(SKU, 1);

    const winner = claimOrder({
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      buyerId: 'buy_winner',
    });
    assert.equal(winner.ok, true);
    if (winner.ok === false) {
      return;
    }

    const loser = claimOrder({
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      buyerId: 'buy_loser',
    });

    assert.equal(loser.ok, false);
    if (loser.ok === true) {
      return;
    }

    assert.equal(loser.reason, 'sold_out');
    assert.ok(loser.neighbor);
    assert.notEqual(loser.neighbor.sku, SKU);
    assert.equal(ordersForBuyer('buy_loser').length, 0);
    assert.equal(getOrderById(winner.order.id)?.id, winner.order.id);

    const neighborHold = getDb().prepare(`
      SELECT order_id
      FROM reservations
      WHERE buyer_id = ? AND status = 'held'
    `).all('buy_loser') as Array<{ order_id: string }>;
    assert.equal(neighborHold.length, 0);
  });
});
