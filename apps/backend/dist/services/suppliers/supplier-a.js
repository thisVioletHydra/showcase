import { getDb } from '../../db.js';
import { grabKeyForOrder } from '../key-pool.service.js';
import { delay, getSupplierConfig, rollSupplierBehavior, SupplierFailureError, SupplierTimeoutError, } from './config.js';
function getStoredIssue(requestId) {
    const db = getDb();
    return db.prepare(`
    SELECT request_id, order_id, code, supplier, status
    FROM issue_requests
    WHERE request_id = ?
  `).get(requestId);
}
function storeIssue(input) {
    const db = getDb();
    db.prepare(`
    INSERT INTO issue_requests (request_id, order_id, code, supplier, status)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(request_id) DO UPDATE SET
      code = COALESCE(excluded.code, issue_requests.code),
      status = excluded.status
  `).run(input.requestId, input.orderId, input.code ?? null, input.supplier, input.status);
}
async function issueFromSupplier(supplierName, configKey, request) {
    const stored = getStoredIssue(request.request_id);
    if (stored?.status === 'ok' && stored.code) {
        return {
            status: 'ok',
            request_id: request.request_id,
            code: stored.code,
        };
    }
    if (stored?.status === 'error') {
        return { status: 'error', reason: 'out_of_stock' };
    }
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
    let code = null;
    try {
        const cached = getStoredIssue(request.request_id);
        if (cached?.code) {
            code = cached.code;
        }
        else {
            const grab = grabKeyForOrder(request.order_id, db);
            if (!grab) {
                storeIssue({
                    requestId: request.request_id,
                    orderId: request.order_id,
                    supplier: supplierName,
                    status: 'error',
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
    }
    catch (error) {
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
        code: code,
    };
}
export async function callSupplierA(request) {
    return issueFromSupplier('supplierA', 'A', request);
}
export async function callSupplierB(request) {
    return issueFromSupplier('supplierB', 'B', request);
}
