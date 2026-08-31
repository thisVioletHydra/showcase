import { getDb } from '../db';
import { getProductBySku } from '../services/products.service';
import {
  createOrderRecord,
  generateOrderId,
  getOrderById,
  updateOrderAmount,
} from '../services/orders.service';
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

  const orderId = generateOrderId();
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

  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  try {
    let finalAmount = baseAmount;
    let promocodeValue: string | null = null;

    if (body.promocode) {
      const promo = applyPromocode(orderId, body.promocode.trim().toUpperCase());
      promocodeValue = promo.code;
      finalAmount = calculateDiscountedPrice(baseAmount, product.currency, promo);
    }

    const order = createOrderRecord({
      id: orderId,
      sku: product.sku,
      amount: finalAmount,
      currency: product.currency,
      promocode: promocodeValue,
    });

    db.prepare('COMMIT').run();

    processPendingWebhooksForOrder(order.id);

    sendJson(res, 201, {
      order_id: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      promocode: order.promocode,
    });
  } catch (error) {
    db.prepare('ROLLBACK').run();
    if (error instanceof PromocodeError) {
      sendError(res, 409, error.message);
      return;
    }
    throw error;
  }
}

export function getOrder(req: ApiRequest, res: ServerResponse): void {
  const order = getOrderById(req.params.id);
  if (!order) {
    sendError(res, 404, 'Order not found');
    return;
  }

  sendJson(res, 200, { order });
}

export function postOrderPromocode(req: ApiRequest, res: ServerResponse): void {
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
