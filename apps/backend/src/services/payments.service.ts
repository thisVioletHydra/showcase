import http from 'node:http';

import { config } from '../config.js';
import { getOrderById } from './orders.service.js';
import {
  generateEventId,
  processPaymentWebhook,
} from './webhook.service.js';
import type { PaymentWebhookPayload } from '../types.js';

export async function simulatePayment(orderId: string, success: boolean): Promise<{
  event_id: string;
  webhook_status: number;
}> {
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const payload: PaymentWebhookPayload = {
    event_id: generateEventId(),
    order_id: orderId,
    status: success ? 'paid' : 'failed',
    amount: order.amount,
    currency: order.currency,
    created_at: new Date().toISOString(),
  };

  const webhookStatus = await postWebhook(payload);
  return { event_id: payload.event_id, webhook_status: webhookStatus };
}

function postWebhook(payload: PaymentWebhookPayload): Promise<number> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port: config.port,
        path: '/webhook/payment',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        response.resume();
        response.on('end', () => {
          resolve(response.statusCode ?? 500);
        });
      },
    );

    request.on('error', reject);
    request.write(body);
    request.end();
  });
}

export function handlePaymentWebhookDirect(payload: PaymentWebhookPayload): void {
  processPaymentWebhook(payload);
}
