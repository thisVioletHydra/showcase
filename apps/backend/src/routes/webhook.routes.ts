import { handlePaymentWebhookDirect } from '../services/payments.service';
import { isValidWebhookSignature } from '../http/security';
import { sendError, sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { PaymentWebhookPayload } from '../types';
import type { ServerResponse } from 'node:http';

export function postPaymentWebhook(req: ApiRequest, res: ServerResponse): void {
  if (!isValidWebhookSignature(req.rawBody, req.headers)) {
    sendError(res, 401, 'Invalid webhook signature');
    return;
  }

  const body = req.body as Partial<PaymentWebhookPayload>;
  const status = body.status;

  if (
    typeof body.event_id !== 'string'
    || typeof body.order_id !== 'string'
    || (status !== 'paid' && status !== 'failed')
  ) {
    sendError(res, 400, 'Invalid webhook payload');
    return;
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount)) {
    sendError(res, 400, 'Invalid webhook payload');
    return;
  }

  const payload: PaymentWebhookPayload = {
    event_id: body.event_id,
    order_id: body.order_id,
    status,
    amount,
    currency: String(body.currency ?? 'RUB'),
    created_at: String(body.created_at ?? new Date().toISOString()),
  };

  handlePaymentWebhookDirect(payload);
  sendJson(res, 200, { ok: true });
}
