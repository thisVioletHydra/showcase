import { getDb } from '../db';
import { getProductBySku } from '../services/products.service';
import {
  generateBuyerId,
  getOrderById,
  updateOrderAmount,
} from '../services/orders.service';
import { claimOrder, expireStaleReservations } from '../services/inventory.service';
import {
  applyPromocode,
  calculateDiscountedPrice,
  PromocodeError,
} from '../services/promocodes.service';
import { processPendingWebhooksForOrder } from '../services/webhook.service';
import { sendError, sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { CreateOrderBody } from '../types';
import type { ServerResponse } from 'node:http';

const TOPUP_MAX_AMOUNT = 20_000;

function resolveBuyerId(raw: unknown): string {
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.trim();
  }

  return generateBuyerId();
}

export function postOrder(req: ApiRequest, res: ServerResponse): void {
  const body = req.body as CreateOrderBody;

  if (!body?.sku) {
    sendError(res, 400, 'sku is required');
    return;
  }

  const product = getProductBySku(body.sku);
  if (!product) {
    sendError(res, 404, 'Product not found');
    return;
  }

  let baseAmount = product.price;

  if (body.amount !== undefined) {
    if (product.type !== 'topup') {
      sendError(res, 400, 'Custom amount is only allowed for topup products');
      return;
    }

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < product.price || amount > TOPUP_MAX_AMOUNT) {
      sendError(res, 400, `amount must be a number between ${product.price} and ${TOPUP_MAX_AMOUNT}`);
      return;
    }

    baseAmount = Math.round(amount * 100) / 100;
  }

  const buyerId = resolveBuyerId(body.buyer_id);
  const reuseId = typeof body.order_id === 'string' && body.order_id.trim().length > 0
    ? body.order_id.trim()
    : undefined;
  const promocodeCode = body.promocode ? body.promocode.trim().toUpperCase() : undefined;

  try {
    const claimed = claimOrder({
      sku: product.sku,
      amount: baseAmount,
      currency: product.currency,
      promocodeCode,
      buyerId,
      orderId: reuseId,
    });

  if (claimed.ok === false) {
      sendJson(res, 409, {
        error: 'Товар закончился',
        code: 'sold_out',
        neighbor: claimed.neighbor,
      });
      return;
    }

    processPendingWebhooksForOrder(claimed.order.id);

    sendJson(res, claimed.created ? 201 : 200, {
      order_id: claimed.order.id,
      status: claimed.order.status,
      amount: claimed.order.amount,
      currency: claimed.order.currency,
      promocode: claimed.order.promocode,
      held_until: claimed.order.held_until,
    });
  } catch (error) {
    if (error instanceof PromocodeError) {
      sendError(res, 409, error.message);
      return;
    }
    throw error;
  }
}

export function getOrder(req: ApiRequest, res: ServerResponse): void {
  expireStaleReservations();
  const order = getOrderById(req.params.id);
  if (!order) {
    sendError(res, 404, 'Order not found');
    return;
  }

  sendJson(res, 200, { order });
}

export function postOrderPromocode(req: ApiRequest, res: ServerResponse): void {
  expireStaleReservations();
  const order = getOrderById(req.params.id);
  if (!order) {
    sendError(res, 404, 'Order not found');
    return;
  }

  if (order.status !== 'created') {
    sendError(res, 409, 'Promocode can only be applied before payment');
    return;
  }

  if (order.promocode) {
    sendError(res, 409, 'Promocode already applied');
    return;
  }

  const body = req.body as { promocode?: string };
  if (!body?.promocode) {
    sendError(res, 400, 'promocode is required');
    return;
  }

  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    const promo = applyPromocode(order.id, body.promocode.trim().toUpperCase());
    const finalAmount = calculateDiscountedPrice(order.amount, order.currency, promo);
    const updated = updateOrderAmount(order.id, finalAmount, promo.code);
    if (!updated) {
      throw new PromocodeError('Could not apply promocode');
    }

    db.prepare('COMMIT').run();
    sendJson(res, 200, { order: getOrderById(order.id) });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    if (error instanceof PromocodeError) {
      sendError(res, 409, error.message);
      return;
    }
    throw error;
  }
}
