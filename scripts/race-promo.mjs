#!/usr/bin/env node

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3000';
const PARALLEL = Number(process.env.PARALLEL ?? 20);
const PROMOCODE = process.env.PROMOCODE ?? 'LIMIT3';
const SKU = process.env.SKU ?? 'KEY-CS2-PRIME';
const EXPECTED_SUCCESS = Number(process.env.EXPECTED_SUCCESS ?? 3);

async function createOrderWithPromo() {
  const response = await fetch(`${API_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: SKU, promocode: PROMOCODE }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

async function main() {
  console.log(`API: ${API_URL}, parallel: ${PARALLEL}, promocode: ${PROMOCODE}`);

  const results = await Promise.all(
    Array.from({ length: PARALLEL }, () => createOrderWithPromo()),
  );

  const success = results.filter((r) => r.status === 201);
  const exhausted = results.filter((r) => r.status === 409);

  console.log(`Success (201): ${success.length}`);
  console.log(`Exhausted (409): ${exhausted.length}`);
  console.log(`Other: ${results.length - success.length - exhausted.length}`);

  if (success.length !== EXPECTED_SUCCESS) {
    throw new Error(`Expected ${EXPECTED_SUCCESS} successful orders, got ${success.length}`);
  }

  const orderIds = new Set(success.map((r) => r.body?.order_id).filter(Boolean));
  if (orderIds.size !== EXPECTED_SUCCESS) {
    throw new Error('Duplicate order ids in successful responses');
  }

  console.log('PASS — promo limit enforced under parallel load');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
