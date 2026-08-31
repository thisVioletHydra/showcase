import { getOrderById } from './orders.service';
import {
  generateEventId,
  processPaymentWebhook,
} from './webhook.service';
import type { PaymentWebhookPayload } from '../types';

export function simulatePayment(orderId: string, success: boolean): {
  event_id: string;
  webhook_status: number;
} {
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

  processPaymentWebhook(payload);
  return { event_id: payload.event_id, webhook_status: 200 };
}

export function handlePaymentWebhookDirect(payload: PaymentWebhookPayload): void {
  processPaymentWebhook(payload);
}
