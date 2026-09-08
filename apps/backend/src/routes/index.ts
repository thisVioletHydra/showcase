import { Router, sendJson } from '../http/router';
import { getProducts, getCatalogStream } from './products.routes';
import { getOrder, postOrder, postOrderPromocode } from './orders.routes';
import { postSimulatePayment } from './payments.routes';
import { postPaymentWebhook } from './webhook.routes';
import {
  getAdminOrders,
  getAdminPromocodes,
  postAdminKeys,
  postAdminRestart,
  postRetryDelivery,
  postSupplierConfig,
} from './admin.routes';
import {
  postDebugPrice,
  postDebugResetHold,
  postDebugSecondBuyer,
  postDebugStockOne,
} from './debug.routes';

export function createAppRouter(): Router {
  const router = new Router();

  router.get('/api/products', getProducts);
  router.get('/api/catalog/stream', getCatalogStream);
  router.post('/api/orders', postOrder);
  router.post('/api/orders/:id/promocode', postOrderPromocode);
  router.get('/api/orders/:id', getOrder);
  router.post('/api/payments/simulate', postSimulatePayment);
  router.post('/webhook/payment', postPaymentWebhook);

  router.get('/api/admin/orders', getAdminOrders);
  router.post('/api/admin/orders/:id/retry-delivery', postRetryDelivery);
  router.post('/api/admin/keys', postAdminKeys);
  router.post('/api/admin/suppliers/config', postSupplierConfig);
  router.get('/api/admin/promocodes', getAdminPromocodes);
  router.post('/api/admin/debug/restart', postAdminRestart);
  router.post('/api/debug/stock-one', postDebugStockOne);
  router.post('/api/debug/price', postDebugPrice);
  router.post('/api/debug/reset-hold', postDebugResetHold);
  router.post('/api/debug/second-buyer', postDebugSecondBuyer);

  router.get('/health', (_req, res) => {
    sendJson(res, 200, { ok: true });
  });

  return router;
}
