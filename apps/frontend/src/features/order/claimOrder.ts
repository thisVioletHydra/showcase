import { apiFetch } from '#/shared/api/client';
import {
  getBuyerId,
  loadPendingOrderId,
  savePendingOrderId,
} from '#/shared/lib/buyer';
import { saveLastOrderId } from '#/shared/lib/orderDisplay';
import type { CreateOrderResponse } from '#/shared/types';

export interface ClaimProductInput {
  sku: string;
  amount?: number;
  currency?: string;
  promocode?: string;
}

const inflight = new Map<string, Promise<CreateOrderResponse>>();

async function postClaim(input: ClaimProductInput): Promise<CreateOrderResponse> {
  const pendingId = loadPendingOrderId(input.sku);
  const body: Record<string, unknown> = {
    sku: input.sku,
    buyer_id: getBuyerId(),
  };

  if (pendingId) {
    body.order_id = pendingId;
  }

  if (input.amount !== undefined) {
    body.amount = input.amount;
  }

  if (input.currency) {
    body.currency = input.currency;
  }

  if (input.promocode) {
    body.promocode = input.promocode;
  }

  const result = await apiFetch<CreateOrderResponse>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  savePendingOrderId(input.sku, result.order_id);
  saveLastOrderId(result.order_id);
  return result;
}

export function claimProductOrder(input: ClaimProductInput): Promise<CreateOrderResponse> {
  const pending = inflight.get(input.sku);
  if (pending) {
    return pending;
  }

  const request = postClaim(input).finally(() => {
    inflight.delete(input.sku);
  });

  inflight.set(input.sku, request);
  return request;
}
