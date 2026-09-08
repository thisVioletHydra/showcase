import { attachCatalogStream } from '../services/live.service';
import { expireStaleReservations } from '../services/inventory.service';
import { listCatalogProducts } from '../services/products.service';
import { sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { ServerResponse } from 'node:http';

export function getProducts(_req: ApiRequest, res: ServerResponse): void {
  expireStaleReservations();
  sendJson(res, 200, { products: listCatalogProducts() }, {
    'Cache-Control': 'no-store',
  });
}

export function getCatalogStream(_req: ApiRequest, res: ServerResponse): void {
  attachCatalogStream(res);
}
