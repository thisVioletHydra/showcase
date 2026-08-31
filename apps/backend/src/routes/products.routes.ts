import { listProducts } from '../services/products.service.js';
import { sendJson } from '../http/router.js';
import type { ApiRequest } from '../http/router.js';
import type { ServerResponse } from 'node:http';

export function getProducts(_req: ApiRequest, res: ServerResponse): void {
  sendJson(res, 200, { products: listProducts() });
}
