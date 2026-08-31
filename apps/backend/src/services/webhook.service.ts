import { getDb } from '../db';
import { processPaidOrder } from './fulfillment.service';
import { getOrderById, transitionOrderStatus } from './orders.service';
import type { PaymentWebhookPayload } from '../types';

export function storeWebhookInbox(payload: PaymentWebhookPayload): void {
  const db = getDb();
  db.prepare(`
    INSERT OR IGNORE INTO webhook_inbox (event_id, order_id, payload, processed)
    VALUES (?, ?, ?, 0)
  `).run(payload.event_id, payload.order_id, JSON.stringify(payload));
}

export function recordPaymentEvent(payload: PaymentWebhookPayload): boolean {
  const db = getDb();
  const now = new Date().toISOString();

  const result = db.prepare(`
    INSERT OR IGNORE INTO payment_events (event_id, order_id, payload, processed_at)
    VALUES (?, ?, ?, ?)
  `).run(payload.event_id, payload.order_id, JSON.stringify(payload), now);

  return result.changes > 0;
}

export function markInboxProcessed(eventId: string): void {
  const db = getDb();
  db.prepare(`
    UPDATE webhook_inbox
    SET processed = 1
    WHERE event_id = ?
  `).run(eventId);
}

/**
 * Inbox-first: if order is missing, keep event in inbox only.
 * Claim payment_events only when we can apply — otherwise early webhooks
 * would be "eaten" on retry without ever paying the order.
 */
export function processPaymentWebhook(payload: PaymentWebhookPayload): void {
  storeWebhookInbox(payload);

  const order = getOrderById(payload.order_id);
  if (!order) {
    return;
  }

  if (!amountsMatch(order.amount, order.currency, payload)) {
    markInboxProcessed(payload.event_id);
    return;
  }

  const isNewEvent = recordPaymentEvent(payload);
  if (!isNewEvent) {
    markInboxProcessed(payload.event_id);
    return;
  }

  applyPaymentToOrder(payload);
  markInboxProcessed(payload.event_id);
}

function amountsMatch(
  orderAmount: number,
  orderCurrency: string,
  payload: PaymentWebhookPayload,
): boolean {
  if (payload.currency !== orderCurrency) {
    return false;
  }

  return Number(payload.amount) === Number(orderAmount);
}

function applyPaymentToOrder(payload: PaymentWebhookPayload): void {
  const order = getOrderById(payload.order_id);
  if (!order) {
    return;
  }

  if (payload.status === 'failed') {
    transitionOrderStatus(payload.order_id, 'created', 'payment_failed');
    return;
  }

  if (payload.status !== 'paid') {
    return;
  }

  const moved = transitionOrderStatus(payload.order_id, 'created', 'paid');
  if (!moved && order.status !== 'paid' && order.status !== 'delivering' && order.status !== 'delivered') {
    return;
  }

  processPaidOrder(payload.order_id);
}

export function processPendingWebhooksForOrder(orderId: string): void {
  const db = getDb();
  const rows = db.prepare(`
    SELECT payload
    FROM webhook_inbox
    WHERE order_id = ? AND processed = 0
    ORDER BY rowid ASC
  `).all(orderId) as Array<{ payload: string }>;

  for (const row of rows) {
    const payload = JSON.parse(row.payload) as PaymentWebhookPayload;
    processPaymentWebhook(payload);
  }
}

export function processPendingWebhooks(): number {
  const db = getDb();
  const rows = db.prepare(`
    SELECT payload
    FROM webhook_inbox
    WHERE processed = 0
    ORDER BY rowid ASC
    LIMIT 100
  `).all() as Array<{ payload: string }>;

  for (const row of rows) {
    const payload = JSON.parse(row.payload) as PaymentWebhookPayload;
    processPaymentWebhook(payload);
  }

  return rows.length;
}

export function generateEventId(): string {
  return `evt_${crypto.randomUUID().replaceAll('-', '')}`;
}
