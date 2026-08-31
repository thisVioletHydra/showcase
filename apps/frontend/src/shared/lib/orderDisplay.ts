const PREFIX = 'showcase:order-display:';

export interface OrderDisplayMeta {
  label: string;
  icon: string;
}

export function saveOrderDisplay(orderId: string, meta: OrderDisplayMeta): void {
  try {
    sessionStorage.setItem(`${PREFIX}${orderId}`, JSON.stringify(meta));
  } catch {
    // ignore quota / private mode
  }
}

const LAST_ORDER_KEY = 'showcase:last-order-id';
const LAST_ORDER_EVENT = 'showcase:last-order';

export function saveLastOrderId(orderId: string): void {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, orderId);
    window.dispatchEvent(new Event(LAST_ORDER_EVENT));
  } catch {
    // ignore quota / private mode
  }
}

export function loadLastOrderId(): string | null {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

export function subscribeLastOrder(onChange: () => void): () => void {
  window.addEventListener(LAST_ORDER_EVENT, onChange);
  return () => {
    window.removeEventListener(LAST_ORDER_EVENT, onChange);
  };
}

export function loadOrderDisplay(orderId: string): OrderDisplayMeta | null {
  try {
    const raw = sessionStorage.getItem(`${PREFIX}${orderId}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<OrderDisplayMeta>;
    if (typeof parsed.label !== 'string' || typeof parsed.icon !== 'string') {
      return null;
    }

    return { label: parsed.label, icon: parsed.icon };
  } catch {
    return null;
  }
}
