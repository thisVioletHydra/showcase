import { getOrderById } from './orders.service';
import { expireStaleReservations } from './inventory.service';
import {
  generateEventId,
  processPaymentWebhook,
} from './webhook.service';
import type { PaymentWebhookPayload } from '../types';

export class PaymentRejectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentRejectedError';
  }
}

export function simulatePayment(orderId: string, success: boolean): {
  event_id: string;
  webhook_status: number;
} {
  expireStaleReservations();
  const order = getOrderById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status === 'expired') {
    throw new PaymentRejectedError('Hold expired');
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
