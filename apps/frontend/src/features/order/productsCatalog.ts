import { apiFetch } from '#/shared/api/client';
import type { Product } from '#/shared/types';

interface ProductsResponse {
  products: Product[];
}

const STORAGE_KEY = 'showcase:products';
const TTL_MS = 60_000;

let memory: { products: Product[]; at: number } | null = null;
let inflight: Promise<Product[]> | null = null;

function readSession(): Product[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { products: Product[]; at: number };
    if (!Array.isArray(parsed.products) || Date.now() - parsed.at > TTL_MS) {
      return null;
    }

    return parsed.products;
  } catch {
    return null;
  }
}

function writeSession(products: Product[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ products, at: Date.now() }));
  } catch {
    // quota / private mode
  }
}

function commit(products: Product[]): void {
  memory = { products, at: Date.now() };
  writeSession(products);
}

export function getCachedProducts(): Product[] | null {
  if (memory && Date.now() - memory.at <= TTL_MS) {
    return memory.products;
  }

  const fromSession = readSession();
  if (fromSession) {
    memory = { products: fromSession, at: Date.now() };
    return fromSession;
  }

  return null;
}

function fetchFresh(onUpdate?: (products: Product[]) => void): Promise<Product[]> {
  if (!inflight) {
    inflight = apiFetch<ProductsResponse>('/api/products')
      .then((data) => {
        commit(data.products);
        onUpdate?.(data.products);
        return data.products;
      })
      .finally(() => {
        inflight = null;
      });
  } else if (onUpdate) {
    void inflight.then(onUpdate);
  }

  return inflight;
}

/** Один запрос на всех подписчиков; из кеша — сразу, сеть — в фоне. */
export function ensureProducts(onUpdate?: (products: Product[]) => void): Promise<Product[]> {
  const cached = getCachedProducts();
  if (cached) {
    void fetchFresh(onUpdate);
    return Promise.resolve(cached);
  }

  return fetchFresh(onUpdate);
}
