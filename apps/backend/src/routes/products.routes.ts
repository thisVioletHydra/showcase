import { listProducts } from '../services/products.service';
import { sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { ServerResponse } from 'node:http';

export function getProducts(_req: ApiRequest, res: ServerResponse): void {
  sendJson(res, 200, { products: listProducts() }, {
    'Cache-Control': 'public, max-age=60',
  });
}
