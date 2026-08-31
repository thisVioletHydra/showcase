import { getProductBySku } from '../services/products.service.js';
import { createOrderRecord, generateOrderId, getOrderById, updateOrderAmount, } from '../services/orders.service.js';
import { applyPromocode, calculateDiscountedPrice, PromocodeError, } from '../services/promocodes.service.js';
import { processPendingWebhooksForOrder } from '../services/webhook.service.js';
import { sendError, sendJson } from '../http/router.js';
export function postOrder(req, res) {
    const body = req.body;
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
    let finalAmount = product.price;
    let promocodeValue = null;
    try {
        if (body.promocode) {
            const promo = applyPromocode(orderId, body.promocode.trim().toUpperCase());
            promocodeValue = promo.code;
            finalAmount = calculateDiscountedPrice(product.price, product.currency, promo);
        }
    }
    catch (error) {
        if (error instanceof PromocodeError) {
            sendError(res, 409, error.message);
            return;
        }
        throw error;
    }
    const order = createOrderRecord({
        id: orderId,
        sku: product.sku,
        amount: finalAmount,
        currency: product.currency,
        promocode: promocodeValue,
    });
    processPendingWebhooksForOrder(order.id);
    sendJson(res, 201, {
        order_id: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        promocode: order.promocode,
    });
}
export function getOrder(req, res) {
    const order = getOrderById(req.params.id);
    if (!order) {
        sendError(res, 404, 'Order not found');
        return;
    }
    sendJson(res, 200, { order });
}
export function postOrderPromocode(req, res) {
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
    const body = req.body;
    if (!body?.promocode) {
        sendError(res, 400, 'promocode is required');
        return;
    }
    const product = getProductBySku(order.sku);
    if (!product) {
        sendError(res, 404, 'Product not found');
        return;
    }
    try {
        const promo = applyPromocode(order.id, body.promocode.trim().toUpperCase());
        const finalAmount = calculateDiscountedPrice(product.price, product.currency, promo);
        const updated = updateOrderAmount(order.id, finalAmount, promo.code);
        if (!updated) {
            sendError(res, 409, 'Could not apply promocode');
            return;
        }
        sendJson(res, 200, { order: getOrderById(order.id) });
    }
    catch (error) {
        if (error instanceof PromocodeError) {
            sendError(res, 409, error.message);
            return;
        }
        throw error;
    }
}
