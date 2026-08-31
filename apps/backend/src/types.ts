export type OrderStatus =
  | 'created'
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'payment_failed'
  | 'out_of_stock'
  | 'delivery_failed';

export type KeyStatus = 'available' | 'issued';

export type ProductType = 'topup' | 'key' | 'subscription' | 'giftcard';

export type PromocodeType = 'percent' | 'amount';

export type SupplierName = 'supplierA' | 'supplierB';

export type IssueRequestStatus = 'pending' | 'ok' | 'error' | 'timeout';

export interface Product {
  sku: string;
  name: string;
  type: ProductType;
  price: number;
  currency: string;
  image: string;
}

export interface Order {
  id: string;
  sku: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  key_code: string | null;
  promocode: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  sku: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  key_code: string | null;
  promocode: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentWebhookPayload {
  event_id: string;
  order_id: string;
  status: 'paid' | 'failed';
  amount: number;
  currency: string;
  created_at: string;
}

export interface SupplierIssueRequest {
  request_id: string;
  sku: string;
  order_id: string;
}

export interface SupplierIssueSuccess {
  status: 'ok';
  request_id: string;
  code: string;
}

export interface SupplierIssueError {
  status: 'error';
  reason: string;
}

export type SupplierIssueResponse = SupplierIssueSuccess | SupplierIssueError;

export interface SupplierConfig {
  errorRate: number;
  timeoutRate: number;
  timeoutMs: number;
}

export interface Promocode {
  code: string;
  type: PromocodeType;
  value: number;
  currency: string | null;
  max_uses: number;
  used_count: number;
}

export interface CreateOrderBody {
  sku: string;
  promocode?: string;
  /** Override product price (topup only). Billing currency is always catalog RUB. */
  amount?: number;
}

export interface SimulatePaymentBody {
  order_id: string;
  success: boolean;
}

export interface AdminKeysBody {
  codes: string[];
}

export interface AdminSupplierConfigBody {
  errorRate?: number;
  timeoutRate?: number;
  timeoutMs?: number;
}
