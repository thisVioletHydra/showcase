import { apiFetch, catalogStreamUrl } from '#/shared/api/client';
import type { CatalogSnapshot, Product } from '#/shared/types';

interface ProductsResponse {
  products: Product[];
}

const listeners = new Set<(products: Product[]) => void>();

let memory: Product[] | null = null;
let inflight: Promise<Product[]> | null = null;
let stream: EventSource | null = null;

function notify(products: Product[]): void {
  memory = products;
  for (const listener of listeners) {
    listener(products);
  }
}

function isCatalog(products: Product[]): boolean {
  return products.every((item) => typeof item.available === 'number' && typeof item.price === 'number');
}

export function getCachedProducts(): Product[] | null {
  return memory && isCatalog(memory) ? memory : null;
}

function fetchFresh(): Promise<Product[]> {
  if (!inflight) {
    inflight = apiFetch<ProductsResponse>('/api/products')
      .then((data) => {
        if (isCatalog(data.products)) {
          notify(data.products);
        }
        return data.products;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export function ensureProducts(onUpdate?: (products: Product[]) => void): Promise<Product[]> {
  if (onUpdate) {
    listeners.add(onUpdate);
  }

  startCatalogStream();

  const cached = getCachedProducts();
  if (cached) {
    onUpdate?.(cached);
    void fetchFresh();
    return Promise.resolve(cached);
  }

  return fetchFresh().then((products) => {
    onUpdate?.(products);
    return products;
  });
}

export function subscribeProducts(onUpdate: (products: Product[]) => void): () => void {
  listeners.add(onUpdate);
  startCatalogStream();

  const cached = getCachedProducts();
  if (cached) {
    onUpdate(cached);
  } else {
    void fetchFresh().then(onUpdate).catch(() => {
      // SSE snapshot is the fallback
    });
  }

  return () => {
    listeners.delete(onUpdate);
  };
}

function applySnapshot(raw: string): void {
  try {
    const parsed = JSON.parse(raw) as CatalogSnapshot;
    if (!Array.isArray(parsed.products) || parsed.products.length === 0) {
      return;
    }

    if (!isCatalog(parsed.products)) {
      return;
    }

    notify(parsed.products);
  } catch {
    // ignore malformed frames
  }
}

export function startCatalogStream(): void {
  if (stream) {
    return;
  }

  if (typeof EventSource === 'undefined') {
    void fetchFresh();
    return;
  }

  const source = new EventSource(catalogStreamUrl());
  stream = source;

  source.addEventListener('snapshot', (event: MessageEvent<string>) => {
    applySnapshot(event.data);
  });

  source.onmessage = (event) => {
    applySnapshot(event.data);
  };

  source.onerror = () => {
    // Keep the last snapshot. EventSource reconnects and the server replays.
  };
}
