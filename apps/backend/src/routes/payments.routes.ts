import { simulatePayment } from '../services/payments.service';
import { sendError, sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { SimulatePaymentBody } from '../types';
import type { ServerResponse } from 'node:http';

export async function postSimulatePayment(req: ApiRequest, res: ServerResponse): Promise<void> {
  const body = req.body as SimulatePaymentBody;

  if (!body?.order_id || typeof body.success !== 'boolean') {
    sendError(res, 400, 'order_id and success are required');
    return;
  }

  try {
    const result = await simulatePayment(body.order_id, body.success);
    sendJson(res, 200, result);
  } catch {
    sendError(res, 404, 'Order not found');
  }
}
