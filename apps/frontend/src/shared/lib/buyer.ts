const BUYER_KEY = 'showcase:buyer-id';
const PENDING_PREFIX = 'showcase:pending-order:';

export function getBuyerId(): string {
  try {
    const existing = sessionStorage.getItem(BUYER_KEY);
    if (existing && existing.length > 0) {
      return existing;
    }

    const created = `buy_${crypto.randomUUID().replaceAll('-', '')}`;
    sessionStorage.setItem(BUYER_KEY, created);
    return created;
  } catch {
    return `buy_${crypto.randomUUID().replaceAll('-', '')}`;
  }
}

export function loadPendingOrderId(sku: string): string | null {
  try {
    return sessionStorage.getItem(`${PENDING_PREFIX}${sku}`);
  } catch {
    return null;
  }
}

export function savePendingOrderId(sku: string, orderId: string): void {
  try {
    sessionStorage.setItem(`${PENDING_PREFIX}${sku}`, orderId);
  } catch {
    // quota / private mode
  }
}

export function clearPendingOrderId(sku: string): void {
  try {
    sessionStorage.removeItem(`${PENDING_PREFIX}${sku}`);
  } catch {
    // quota / private mode
  }
}

export function rotateBuyerId(): string {
  const created = `buy_${crypto.randomUUID().replaceAll('-', '')}`;
  try {
    sessionStorage.setItem(BUYER_KEY, created);
    const keys: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(PENDING_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // quota / private mode
  }

  return created;
}
