import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { closeDb, getDb } from '../src/db';
import { seedDatabase } from '../src/seed';
import { deliverOrder, processPaidOrder, retryDelivery } from '../src/services/fulfillment.service';
import {
  createOrderRecord,
  generateOrderId,
  getOrderById,
} from '../src/services/orders.service';
import { insertKeys } from '../src/services/products.service';
import {
  applyPromocode,
  PromocodeError,
} from '../src/services/promocodes.service';
import { setAllSupplierConfig } from '../src/services/suppliers/index';
import {
  processPaymentWebhook,
  processPendingWebhooksForOrder,
} from '../src/services/webhook.service';
import type { PaymentWebhookPayload } from '../src/types';

const SKU = 'KEY-CS2-PRIME';
const AMOUNT = 1290;
const CURRENCY = 'RUB';

function paidPayload(orderId: string, eventId: string, amount = AMOUNT): PaymentWebhookPayload {
  return {
    event_id: eventId,
    order_id: orderId,
    status: 'paid',
    amount,
    currency: CURRENCY,
    created_at: new Date().toISOString(),
  };
}

async function waitUntil(
  orderId: string,
  predicate: (order: NonNullable<ReturnType<typeof getOrderById>>) => boolean,
  attempts = 80,
): Promise<NonNullable<ReturnType<typeof getOrderById>>> {
  for (let i = 0; i < attempts; i += 1) {
    const order = getOrderById(orderId);
    if (order && predicate(order)) {
      return order;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const order = getOrderById(orderId);
  assert.ok(order, `order ${orderId} missing`);
  return order;
}

describe('TZ acceptance (backend)', () => {
  before(() => {
    const db = getDb();
    seedDatabase(db);
    setAllSupplierConfig({ errorRate: 0, timeoutRate: 0, timeoutMs: 100 });
  });

  after(() => {
    closeDb();
  });

  it('50 unique paid webhooks on one order → exactly one key', async () => {
    const orderId = generateOrderId();
    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    await Promise.all(
      Array.from({ length: 50 }, (_, index) => {
        processPaymentWebhook(paidPayload(orderId, `evt_uni_${orderId}_${index}`));
      }),
    );

    await deliverOrder(orderId);

    const order = await waitUntil(orderId, (o) => o.status === 'delivered' && Boolean(o.key_code));
    assert.equal(order.status, 'delivered');
    assert.ok(order.key_code);

    const db = getDb();
    const fulfillments = db.prepare(
      'SELECT COUNT(*) AS c FROM fulfillments WHERE order_id = ?',
    ).get(orderId) as { c: number };
    assert.equal(fulfillments.c, 1);
  });

  it('duplicate event_id is a no-op', async () => {
    const orderId = generateOrderId();
    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    const eventId = `evt_dup_${orderId}`;
    processPaymentWebhook(paidPayload(orderId, eventId));
    await deliverOrder(orderId);
    const first = await waitUntil(orderId, (o) => Boolean(o.key_code));

    for (let i = 0; i < 20; i += 1) {
      processPaymentWebhook(paidPayload(orderId, eventId));
    }
    await deliverOrder(orderId);

    const second = getOrderById(orderId);
    assert.equal(second?.key_code, first.key_code);
    assert.equal(second?.status, 'delivered');
  });

  it('webhook before order exists applies on create (early inbox)', async () => {
    const orderId = generateOrderId();
    const eventId = `evt_early_${orderId}`;

    processPaymentWebhook(paidPayload(orderId, eventId));
    assert.equal(getOrderById(orderId), undefined);

    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    processPendingWebhooksForOrder(orderId);
    await deliverOrder(orderId);

    const order = await waitUntil(orderId, (o) => o.status === 'delivered' && Boolean(o.key_code));
    assert.ok(order.key_code);

    processPaymentWebhook(paidPayload(orderId, eventId));
    const again = getOrderById(orderId);
    assert.equal(again?.key_code, order.key_code);
  });

  it('empty pool → out_of_stock; refill + retry → one key; retry idempotent', async () => {
    const db = getDb();
    db.prepare(`UPDATE key_pool SET status = 'issued' WHERE status = 'available'`).run();

    const orderId = generateOrderId();
    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    processPaymentWebhook(paidPayload(orderId, `evt_oos_${orderId}`));
    await deliverOrder(orderId);

    const empty = await waitUntil(
      orderId,
      (o) => o.status === 'out_of_stock' || o.status === 'delivery_failed' || Boolean(o.key_code),
    );
    assert.equal(empty.status, 'out_of_stock');
    assert.equal(empty.key_code, null);

    insertKeys(['TEST-KEY-RECOVER-001', 'TEST-KEY-RECOVER-002']);

    const retry = retryDelivery(orderId);
    assert.equal(retry.ok, true);
    await deliverOrder(orderId, { isRetry: true });

    const recovered = await waitUntil(orderId, (o) => o.status === 'delivered' && Boolean(o.key_code));
    assert.ok(recovered.key_code);

    retryDelivery(orderId);
    await deliverOrder(orderId, { isRetry: true });
    const again = getOrderById(orderId);
    assert.equal(again?.key_code, recovered.key_code);
  });

  it('LIMIT3 promocode under parallel apply → at most 3 uses', () => {
    const results = Array.from({ length: 20 }, (_, index) => {
      const orderId = `ord_promo_${Date.now()}_${index}`;
      try {
        applyPromocode(orderId, 'LIMIT3');
        createOrderRecord({
          id: orderId,
          sku: SKU,
          amount: Math.round(AMOUNT * 0.75),
          currency: CURRENCY,
          promocode: 'LIMIT3',
        });
        return 'ok';
      } catch (error) {
        if (error instanceof PromocodeError) {
          return 'reject';
        }
        throw error;
      }
    });

    const ok = results.filter((r) => r === 'ok').length;
    const rejected = results.filter((r) => r === 'reject').length;
    assert.equal(ok, 3);
    assert.equal(rejected, 17);

    const row = getDb().prepare(
      `SELECT used_count FROM promocodes WHERE code = 'LIMIT3'`,
    ).get() as { used_count: number };
    assert.equal(row.used_count, 3);
  });

  it('rejects webhook amount mismatch', () => {
    const orderId = generateOrderId();
    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    processPaymentWebhook(paidPayload(orderId, `evt_bad_amt_${orderId}`, AMOUNT + 1));
    const order = getOrderById(orderId);
    assert.equal(order?.status, 'created');
    assert.equal(order?.key_code, null);
  });

  it('payment_failed does not issue a key', async () => {
    const orderId = generateOrderId();
    createOrderRecord({
      id: orderId,
      sku: SKU,
      amount: AMOUNT,
      currency: CURRENCY,
      promocode: null,
    });

    processPaymentWebhook({
      event_id: `evt_fail_${orderId}`,
      order_id: orderId,
      status: 'failed',
      amount: AMOUNT,
      currency: CURRENCY,
      created_at: new Date().toISOString(),
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    const order = getOrderById(orderId);
    assert.equal(order?.status, 'payment_failed');
    assert.equal(order?.key_code, null);
  });
});
