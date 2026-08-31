import { Router, sendJson } from '../http/router';
import { getProducts } from './products.routes';
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
  router.get('/api/admin/promocodes', getAdminPromocodes);
  router.post('/api/admin/debug/restart', postAdminRestart);

  router.get('/health', (_req, res) => {
    sendJson(res, 200, { ok: true });
  });

  return router;
}
