#!/usr/bin/env node

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3000';
const PARALLEL = Number(process.env.PARALLEL ?? 50);
const SKU = process.env.SKU ?? 'KEY-CS2-PRIME';

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
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

async function createOrder() {
  const { status, body } = await request('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ sku: SKU }),
  });
  if (status !== 201) {
    throw new Error(`Failed to create order: ${status} ${JSON.stringify(body)}`);
  }
  return body.order_id;
}

async function sendWebhook(payload) {
  return request('/webhook/payment', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function getOrder(orderId) {
  const { body } = await request(`/api/orders/${orderId}`);
  return body?.order;
}

async function countFulfillmentsViaOrder(orderId) {
  const order = await getOrder(orderId);
  return order?.key_code ? 1 : 0;
}

function buildPayload(orderId, eventId, order) {
  return {
    event_id: eventId,
    order_id: orderId,
    status: 'paid',
    amount: order?.amount ?? 1290,
    currency: order?.currency ?? 'RUB',
    created_at: new Date().toISOString(),
  };
}

async function runDuplicateEventIdTest() {
  console.log('\n=== Test 1: duplicate event_id (50 parallel) ===');
  const orderId = await createOrder();
  const order = await getOrder(orderId);
  const eventId = `race_dup_${Date.now()}`;
  const payload = buildPayload(orderId, eventId, order);

  const results = await Promise.all(
    Array.from({ length: PARALLEL }, () => sendWebhook(payload)),
  );

  const okCount = results.filter((r) => r.status === 200).length;
  await new Promise((r) => setTimeout(r, 1500));
  const orderAfter = await getOrder(orderId);
  const keyCount = orderAfter?.key_code ? 1 : 0;

  console.log(`Responses 200: ${okCount}/${PARALLEL}`);
  console.log(`Order status: ${orderAfter?.status}, key issued: ${keyCount}`);
  if (okCount !== PARALLEL || keyCount !== 1) {
    throw new Error('Duplicate event_id test failed');
  }
  console.log('PASS');
}

async function runUniqueEventIdsTest() {
  console.log('\n=== Test 2: unique event_ids on one order (50 parallel) ===');
  const orderId = await createOrder();
  const order = await getOrder(orderId);

  const results = await Promise.all(
    Array.from({ length: PARALLEL }, (_, index) => {
      const eventId = `race_uni_${Date.now()}_${index}`;
      return sendWebhook(buildPayload(orderId, eventId, order));
    }),
  );

  const okCount = results.filter((r) => r.status === 200).length;
  await new Promise((r) => setTimeout(r, 2000));
  const orderAfter = await getOrder(orderId);
  const keyCount = orderAfter?.key_code ? 1 : 0;

  console.log(`Responses 200: ${okCount}/${PARALLEL}`);
  console.log(`Order status: ${orderAfter?.status}, key issued: ${keyCount}`);
  if (okCount !== PARALLEL || keyCount !== 1) {
    throw new Error('Unique event_ids test failed — expected exactly 1 key');
  }
  console.log('PASS');
}

async function main() {
  console.log(`API: ${API_URL}, parallel: ${PARALLEL}, sku: ${SKU}`);
  await runDuplicateEventIdTest();
  await runUniqueEventIdsTest();
  console.log('\nAll webhook race tests passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
