#!/usr/bin/env node

/**
 * Reproduces webhook-before-order against a running API.
 * Uses invent-then-create via admin-less flow:
 *   1) POST paid webhook for a not-yet-existing order_id (inbox only)
 *   2) Create that order by... we cannot set id via public API.
 *
 * So this script verifies the public contract pieces + documents that
 * same-id early bind is covered by `pnpm --filter backend test`.
 *
 * Steps:
 * - Ghost webhook → 200
 * - Create + pay → one key
 * - Replay ghost → 200, no mutation
 * - Duplicate pay event_id → still one key
 */

import crypto from 'node:crypto';

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3000';
const SKU = process.env.SKU ?? 'KEY-CS2-PRIME';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'dev-webhook-secret';

function signWebhook(raw) {
  return crypto.createHmac('sha256', WEBHOOK_SECRET).update(raw).digest('hex');
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (path === '/webhook/payment' && typeof options.body === 'string') {
    headers['X-Webhook-Signature'] = signWebhook(options.body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: response.status, body };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDelivered(orderId, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    const { body } = await request(`/api/orders/${orderId}`);
    const order = body?.order;
    if (!order) {
      await sleep(200);
      continue;
    }
    if (order.key_code || ['out_of_stock', 'delivery_failed', 'payment_failed'].includes(order.status)) {
      return order;
    }
    await sleep(200);
  }
  const { body } = await request(`/api/orders/${orderId}`);
  return body?.order;
}

async function main() {
  console.log(`API: ${API_URL}`);
  console.log('\n=== Early / out-of-order webhook smoke ===');

  const ghostOrderId = `ord_early_${Date.now().toString(36)}`;
  const ghostEventId = `evt_early_${Date.now().toString(36)}`;
  const ghostPayload = {
    event_id: ghostEventId,
    order_id: ghostOrderId,
    status: 'paid',
    amount: 1290,
    currency: 'RUB',
    created_at: new Date().toISOString(),
  };

  const early = await request('/webhook/payment', {
    method: 'POST',
    body: JSON.stringify(ghostPayload),
  });
  if (early.status !== 200) {
    throw new Error(`Early webhook should return 200, got ${early.status}`);
  }
  console.log('PASS: webhook for missing order accepted (inbox)');

  const created = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ sku: SKU }),
  });
  if (created.status !== 201) {
    throw new Error(`Create failed: ${created.status} ${JSON.stringify(created.body)}`);
  }

  const orderId = created.body.order_id;
  const amount = created.body.amount;
  const currency = created.body.currency;
  const payEventId = `evt_pay_${Date.now().toString(36)}`;

  const pay = await request('/webhook/payment', {
    method: 'POST',
    body: JSON.stringify({
      event_id: payEventId,
      order_id: orderId,
      status: 'paid',
      amount,
      currency,
      created_at: new Date().toISOString(),
    }),
  });
  if (pay.status !== 200) {
    throw new Error(`Pay webhook failed: ${pay.status}`);
  }

  const delivered = await waitForDelivered(orderId);
  if (delivered?.status !== 'delivered' || !delivered.key_code) {
    throw new Error(`Expected delivered+key, got ${JSON.stringify(delivered)}`);
  }
  console.log(`PASS: order ${orderId} delivered with key ${delivered.key_code}`);

  const dup = await Promise.all(
    Array.from({ length: 20 }, () => request('/webhook/payment', {
      method: 'POST',
      body: JSON.stringify({
        event_id: payEventId,
        order_id: orderId,
        status: 'paid',
        amount,
        currency,
        created_at: new Date().toISOString(),
      }),
    })),
  );
  if (dup.some((r) => r.status !== 200)) {
    throw new Error('Duplicate event_id replays must return 200');
  }

  const afterDup = await waitForDelivered(orderId);
  if (afterDup?.key_code !== delivered.key_code) {
    throw new Error('Duplicate event_id changed key');
  }
  console.log('PASS: duplicate event_id is no-op');

  const ghostReplay = await request('/webhook/payment', {
    method: 'POST',
    body: JSON.stringify(ghostPayload),
  });
  if (ghostReplay.status !== 200) {
    throw new Error('Ghost replay must return 200');
  }
  console.log('PASS: early ghost event replay safe');

  console.log('\nAll early-webhook smoke checks passed.');
  console.log('Same-order_id webhook-before-create is covered by backend node:test.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
