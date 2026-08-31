import { handlePaymentWebhookDirect } from '../services/payments.service.js';
import { sendError, sendJson } from '../http/router.js';
export function postPaymentWebhook(req, res) {
    const body = req.body;
    if (!body.event_id || !body.order_id || !body.status) {
        sendError(res, 400, 'Invalid webhook payload');
        return;
    }
    const payload = {
        event_id: body.event_id,
        order_id: body.order_id,
        status: body.status,
        amount: Number(body.amount ?? 0),
        currency: String(body.currency ?? 'RUB'),
        created_at: String(body.created_at ?? new Date().toISOString()),
    };
    handlePaymentWebhookDirect(payload);
    sendJson(res, 200, { ok: true });
}
