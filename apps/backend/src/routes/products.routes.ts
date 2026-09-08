import { attachCatalogStream } from '../services/live.service';
import { expireStaleReservations } from '../services/inventory.service';
import {
  listCatalogProducts,
  parseProductType,
  sanitizeSearchNeedle,
  searchCatalog,
} from '../services/products.service';
import { sendJson } from '../http/router';
import type { ApiRequest } from '../http/router';
import type { ServerResponse } from 'node:http';

function readInt(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : undefined;
}

export function getProducts(req: ApiRequest, res: ServerResponse): void {
  expireStaleReservations();

  const needle = sanitizeSearchNeedle(req.query.q ?? '');
  const type = parseProductType(req.query.type);
  const searching = needle.length > 0 || type !== undefined;

  if (searching === false) {
    sendJson(res, 200, { products: listCatalogProducts() }, {
      'Cache-Control': 'no-store',
    });
    return;
  }

  const result = searchCatalog({
    q: needle || undefined,
    type,
    limit: readInt(req.query.limit),
    offset: readInt(req.query.offset),
  });

  sendJson(res, 200, result, {
    'Cache-Control': 'no-store',
  });
}

export function getCatalogStream(_req: ApiRequest, res: ServerResponse): void {
  attachCatalogStream(res);
}
