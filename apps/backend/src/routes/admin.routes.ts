import process from 'node:process';

import { config } from '../config';
import { insertKeys } from '../services/products.service';
import { listOrdersByStatus } from '../services/orders.service';
import { retryDelivery } from '../services/fulfillment.service';
import { listPromocodes } from '../services/promocodes.service';
import { setAllSupplierConfig } from '../services/suppliers/index';
import {
  getBearerToken,
  sendError,
  sendJson,
} from '../http/router';
import { safeEqual } from '../http/security';
import type { ApiRequest } from '../http/router';
import type { AdminKeysBody, AdminSupplierConfigBody } from '../types';
import type { ServerResponse } from 'node:http';

const MAX_ADMIN_KEYS = 1000;

function assertAdmin(req: ApiRequest, res: ServerResponse): boolean {
  const token = getBearerToken(req.headers);
  if (!token || !safeEqual(token, config.adminToken)) {
    sendError(res, 401, 'Unauthorized');
    return false;
  }
  return true;
}

export function getAdminOrders(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const orders = listOrdersByStatus(req.query.status);
  sendJson(res, 200, { orders });
}

export function postRetryDelivery(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const result = retryDelivery(req.params.id);
  if (!result.ok) {
    sendError(res, 404, 'Order not found or not retriable');
    return;
  }

  sendJson(res, 200, { ok: true, order: result.order });
}

export function postAdminKeys(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const body = req.body as AdminKeysBody;
  if (!Array.isArray(body?.codes) || body.codes.length === 0) {
    sendError(res, 400, 'codes array is required');
    return;
  }

  if (body.codes.length > MAX_ADMIN_KEYS) {
    sendError(res, 400, `codes length must be <= ${MAX_ADMIN_KEYS}`);
    return;
  }

  const codes = body.codes.filter((code): code is string => {
    return typeof code === 'string' && code.trim().length > 0;
  }).map((code) => code.trim());

  if (codes.length === 0) {
    sendError(res, 400, 'codes array is required');
    return;
  }

  const inserted = insertKeys(codes);
  sendJson(res, 200, { inserted, total: codes.length });
}

export function postSupplierConfig(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  const body = req.body as AdminSupplierConfigBody;
  const patch: AdminSupplierConfigBody = {};

  if (typeof body.errorRate === 'number' && Number.isFinite(body.errorRate)) {
    patch.errorRate = body.errorRate;
  }
  if (typeof body.timeoutRate === 'number' && Number.isFinite(body.timeoutRate)) {
    patch.timeoutRate = body.timeoutRate;
  }
  if (typeof body.timeoutMs === 'number' && Number.isFinite(body.timeoutMs)) {
    patch.timeoutMs = body.timeoutMs;
  }

  const configState = setAllSupplierConfig(patch);
  sendJson(res, 200, { suppliers: configState });
}

export function getAdminPromocodes(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  sendJson(res, 200, { promocodes: listPromocodes() });
}

export function postAdminRestart(req: ApiRequest, res: ServerResponse): void {
  if (!assertAdmin(req, res)) {
    return;
  }

  sendJson(res, 202, { ok: true, restarting: true });
  setTimeout(() => {
    process.exit(0);
  }, 150);
}
