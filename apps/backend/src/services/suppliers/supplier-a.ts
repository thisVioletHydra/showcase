import { getDb } from '../../db';
import { grabKeyForOrder } from '../key-pool.service';
import {
  delay,
  getSupplierConfig,
  rollSupplierBehavior,
  SupplierFailureError,
  SupplierTimeoutError,
} from './config';
import type { SupplierIssueRequest, SupplierIssueResponse } from '../../types';

function getStoredIssue(requestId: string) {
  const db = getDb();
  return db.prepare(`
    SELECT request_id, order_id, code, supplier, status
    FROM issue_requests
    WHERE request_id = ?
  `).get(requestId) as {
    request_id: string;
    order_id: string;
    code: string | null;
    supplier: string;
    status: string;
  } | undefined;
}

function storeIssue(input: {
  requestId: string;
  orderId: string;
  supplier: string;
  status: string;
  code?: string | null;
}): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO issue_requests (request_id, order_id, code, supplier, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(request_id) DO UPDATE SET
      code = COALESCE(excluded.code, issue_requests.code),
      status = excluded.status
  `).run(input.requestId, input.orderId, input.code ?? null, input.supplier, input.status);
}

async function issueFromSupplier(
  supplierName: 'supplierA' | 'supplierB',
  configKey: 'A' | 'B',
  request: SupplierIssueRequest,
): Promise<SupplierIssueResponse> {
  const stored = getStoredIssue(request.request_id);
  if (stored?.status === 'ok' && stored.code) {
    return {
      status: 'ok',
      request_id: request.request_id,
      code: stored.code,
    };
  }

  // Do not short-circuit on prior out_of_stock/error — admin recovery
  // after refill must be able to grab a key with the same request_id.
  // Success (ok+code) stays sticky for timeout idempotency.

  const config = getSupplierConfig(configKey);
  const behavior = rollSupplierBehavior(config);

  if (behavior === 'error') {
    storeIssue({
      requestId: request.request_id,
      orderId: request.order_id,
      supplier: supplierName,
      status: 'error',
    });
    throw new SupplierFailureError('supplier_error');
  }

  const db = getDb();
  db.prepare('BEGIN IMMEDIATE').run();

  let code: string | null = null;

  try {
    const cached = getStoredIssue(request.request_id);
    if (cached?.code) {
      code = cached.code;
    } else {
      const grab = grabKeyForOrder(request.order_id, db);
      if (!grab) {
        storeIssue({
          requestId: request.request_id,
          orderId: request.order_id,
          supplier: supplierName,
          status: 'out_of_stock',
        });
        db.prepare('COMMIT').run();
        return { status: 'error', reason: 'out_of_stock' };
      }
      code = grab.code;
      storeIssue({
        requestId: request.request_id,
        orderId: request.order_id,
        supplier: supplierName,
        status: 'ok',
        code,
      });
    }

    db.prepare('COMMIT').run();
  } catch (error) {
    db.prepare('ROLLBACK').run();
    throw error;
  }

  if (behavior === 'timeout') {
    await delay(config.timeoutMs + 100);
    throw new SupplierTimeoutError();
  }

  return {
    status: 'ok',
    request_id: request.request_id,
    code: code!,
  };
}

export async function callSupplierA(request: SupplierIssueRequest): Promise<SupplierIssueResponse> {
  return issueFromSupplier('supplierA', 'A', request);
}

export async function callSupplierB(request: SupplierIssueRequest): Promise<SupplierIssueResponse> {
  return issueFromSupplier('supplierB', 'B', request);
}
