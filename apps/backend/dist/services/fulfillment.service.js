import { getFulfillmentKey, runImmediate } from './key-pool.service.js';
import { getOrderById, setOrderKey, transitionOrderStatus, } from './orders.service.js';
import { callSupplierA, callSupplierB, SupplierFailureError, SupplierTimeoutError, } from './suppliers/index.js';
const deliveryInFlight = new Set();
export async function deliverOrder(orderId, options = {}) {
    if (deliveryInFlight.has(orderId)) {
        return;
    }
    deliveryInFlight.add(orderId);
    try {
        await runDelivery(orderId, options.isRetry ?? false);
    }
    finally {
        deliveryInFlight.delete(orderId);
    }
}
async function runDelivery(orderId, isRetry) {
    const order = getOrderById(orderId);
    if (!order) {
        return;
    }
    const existingKey = getFulfillmentKey(orderId);
    if (existingKey) {
        setOrderKey(orderId, existingKey);
        return;
    }
    const deliverableStatuses = isRetry
        ? ['paid', 'out_of_stock', 'delivery_failed']
        : ['paid'];
    const moved = runImmediate((db) => {
        return transitionOrderStatus(orderId, deliverableStatuses, 'delivering', db);
    });
    if (!moved && order.status !== 'delivering') {
        return;
    }
    const requestA = `${orderId}-1`;
    const requestB = `${orderId}-2`;
    try {
        const resultA = await callSupplierA({
            request_id: requestA,
            sku: order.sku,
            order_id: orderId,
        });
        if (resultA.status === 'ok') {
            finalizeDelivery(orderId, resultA.code);
            return;
        }
        if (resultA.reason === 'out_of_stock') {
            transitionOrderStatus(orderId, ['delivering', 'paid'], 'out_of_stock');
            return;
        }
    }
    catch (error) {
        if (error instanceof SupplierTimeoutError) {
            try {
                const retryA = await callSupplierA({
                    request_id: requestA,
                    sku: order.sku,
                    order_id: orderId,
                });
                if (retryA.status === 'ok') {
                    finalizeDelivery(orderId, retryA.code);
                    return;
                }
                if (retryA.reason === 'out_of_stock') {
                    transitionOrderStatus(orderId, ['delivering', 'paid'], 'out_of_stock');
                    return;
                }
            }
            catch (retryError) {
                if (!(retryError instanceof SupplierFailureError)) {
                    throw retryError;
                }
            }
        }
        else if (!(error instanceof SupplierFailureError)) {
            throw error;
        }
    }
    try {
        const resultB = await callSupplierB({
            request_id: requestB,
            sku: order.sku,
            order_id: orderId,
        });
        if (resultB.status === 'ok') {
            finalizeDelivery(orderId, resultB.code);
            return;
        }
        if (resultB.reason === 'out_of_stock') {
            transitionOrderStatus(orderId, ['delivering', 'paid'], 'out_of_stock');
            return;
        }
    }
    catch (error) {
        if (error instanceof SupplierTimeoutError) {
            try {
                const retryB = await callSupplierB({
                    request_id: requestB,
                    sku: order.sku,
                    order_id: orderId,
                });
                if (retryB.status === 'ok') {
                    finalizeDelivery(orderId, retryB.code);
                    return;
                }
                if (retryB.reason === 'out_of_stock') {
                    transitionOrderStatus(orderId, ['delivering', 'paid'], 'out_of_stock');
                    return;
                }
            }
            catch (retryError) {
                if (!(retryError instanceof SupplierFailureError)) {
                    throw retryError;
                }
            }
        }
        else if (!(error instanceof SupplierFailureError)) {
            throw error;
        }
    }
    transitionOrderStatus(orderId, ['delivering'], 'delivery_failed');
}
function finalizeDelivery(orderId, keyCode) {
    runImmediate((db) => {
        const existing = getFulfillmentKey(orderId, db);
        const code = existing ?? keyCode;
        if (!existing) {
            const now = new Date().toISOString();
            db.prepare(`
        INSERT OR IGNORE INTO fulfillments (order_id, key_code, fulfilled_at)
        VALUES (?, ?, ?)
      `).run(orderId, code, now);
        }
        setOrderKey(orderId, code, db);
    });
}
export function retryDelivery(orderId) {
    const order = getOrderById(orderId);
    if (!order) {
        return { ok: false };
    }
    const retriable = ['paid', 'out_of_stock', 'delivery_failed'];
    if (!retriable.includes(order.status)) {
        return { ok: false, order };
    }
    void deliverOrder(orderId, { isRetry: true });
    return { ok: true, order: getOrderById(orderId) };
}
export function processPaidOrder(orderId) {
    void deliverOrder(orderId);
}
