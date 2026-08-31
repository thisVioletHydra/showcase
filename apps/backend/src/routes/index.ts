import { Router, sendJson } from '../http/router.js';
import { getProducts } from './products.routes.js';
import { getOrder, postOrder, postOrderPromocode } from './orders.routes.js';
import { postSimulatePayment } from './payments.routes.js';
import { postPaymentWebhook } from './webhook.routes.js';
import {
  getAdminOrders,
  postAdminKeys,
  postRetryDelivery,
  postSupplierConfig,
} from './admin.routes.js';

export function createAppRouter(): Router {
  const router = new Router();

  router.get('/api/products', getProducts);
  router.post('/api/orders', postOrder);
  router.post('/api/orders/:id/promocode', postOrderPromocode);
  router.get('/api/orders/:id', getOrder);
  router.post('/api/payments/simulate', postSimulatePayment);
  router.post('/webhook/payment', postPaymentWebhook);

  router.get('/api/admin/orders', getAdminOrders);
  router.post('/api/admin/orders/:id/retry-delivery', postRetryDelivery);
  router.post('/api/admin/keys', postAdminKeys);
  router.post('/api/admin/suppliers/config', postSupplierConfig);

  router.get('/health', (_req, res) => {
    sendJson(res, 200, { ok: true });
  });

  return router;
}
