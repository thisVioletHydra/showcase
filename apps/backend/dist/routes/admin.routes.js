import { config } from '../config.js';
import { insertKeys } from '../services/products.service.js';
import { listOrdersByStatus } from '../services/orders.service.js';
import { retryDelivery } from '../services/fulfillment.service.js';
import { setAllSupplierConfig } from '../services/suppliers/index.js';
import { getBearerToken, sendError, sendJson, } from '../http/router.js';
function assertAdmin(req, res) {
    const token = getBearerToken(req.headers);
    if (token !== config.adminToken) {
        sendError(res, 401, 'Unauthorized');
        return false;
    }
    return true;
}
export function getAdminOrders(req, res) {
    if (!assertAdmin(req, res)) {
        return;
    }
    const orders = listOrdersByStatus(req.query.status);
    sendJson(res, 200, { orders });
}
export function postRetryDelivery(req, res) {
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
export function postAdminKeys(req, res) {
    if (!assertAdmin(req, res)) {
        return;
    }
    const body = req.body;
    if (!Array.isArray(body?.codes) || body.codes.length === 0) {
        sendError(res, 400, 'codes array is required');
        return;
    }
    const inserted = insertKeys(body.codes);
    sendJson(res, 200, { inserted, total: body.codes.length });
}
export function postSupplierConfig(req, res) {
    if (!assertAdmin(req, res)) {
        return;
    }
    const body = req.body;
    const patch = {};
    if (body.errorRate !== undefined) {
        patch.errorRate = body.errorRate;
    }
    if (body.timeoutRate !== undefined) {
        patch.timeoutRate = body.timeoutRate;
    }
    if (body.timeoutMs !== undefined) {
        patch.timeoutMs = body.timeoutMs;
    }
    const configState = setAllSupplierConfig(patch);
    sendJson(res, 200, { suppliers: configState });
}
