import { generateBuyerId } from '../services/orders.service';
import { getProductBySku, updateProductPrice } from '../services/products.service';
import {
  claimOrder,
  resetHoldsForSku,
  setAvailableCount,
} from '../services/inventory.service';
import { publishCatalog } from '../services/live.service';
import { assertAdmin } from './admin.routes';
import { sendError, sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { ServerResponse } from 'node:http';

interface DebugBody {
  sku?: string;
  price?: number;
}

const PRICE_STEP = 100;

function readSku(body: DebugBody, res: ServerResponse): string | null {
  if (typeof body.sku !== 'string' || body.sku.trim().length === 0) {
    sendError(res, 400, 'sku is required');
    return null;
  }

  const sku = body.sku.trim();
  if (!getProductBySku(sku)) {
    sendError(res, 404, 'Product not found');
    return null;
  }

  return sku;
}

export function postDebugStockOne(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const sku = readSku(req.body as DebugBody, res);
  if (!sku) {
    return;
  }

  const available = setAvailableCount(sku, 1);
  sendJson(res, 200, { sku, available, products: publishCatalog().products });
}

export function postDebugPrice(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const body = req.body as DebugBody;
  const sku = readSku(body, res);
  if (!sku) {
    return;
  }

  const product = getProductBySku(sku);
  if (!product) {
    sendError(res, 404, 'Product not found');
    return;
  }

  const nextPrice = typeof body.price === 'number' && Number.isFinite(body.price) && body.price > 0
    ? Math.round(body.price * 100) / 100
    : product.price + PRICE_STEP;

  updateProductPrice(sku, nextPrice);
  sendJson(res, 200, {
    sku,
    price: nextPrice,
    products: publishCatalog().products,
  });
}

export function postDebugResetHold(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const sku = readSku(req.body as DebugBody, res);
  if (!sku) {
    return;
  }

  const released = resetHoldsForSku(sku);
  sendJson(res, 200, { sku, released, products: publishCatalog().products });
}

export function postDebugSecondBuyer(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const sku = readSku(req.body as DebugBody, res);
  if (!sku) {
    return;
  }

  const product = getProductBySku(sku);
  if (!product) {
    sendError(res, 404, 'Product not found');
    return;
  }

  const buyerId = generateBuyerId();
  const claimed = claimOrder({
    sku: product.sku,
    amount: product.price,
    currency: product.currency,
    buyerId,
  });

  if (claimed.ok === false) {
    sendJson(res, 409, {
      error: 'Товар закончился',
      code: 'sold_out',
      neighbor: claimed.neighbor,
      products: publishCatalog().products,
    });
    return;
  }

  sendJson(res, claimed.created ? 201 : 200, {
    order_id: claimed.order.id,
    status: claimed.order.status,
    held_until: claimed.order.held_until,
    buyer_id: buyerId,
    products: publishCatalog().products,
  });
}
