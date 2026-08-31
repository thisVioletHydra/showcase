import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '#/shared/api/client';
import type { Product } from '#/shared/types';

interface ProductsResponse {
  products: Product[];
}

/** `limit <= 0` — весь каталог с API. */
export function useProducts(limit = 5) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiFetch<ProductsResponse>('/api/products')
      .then((data) => {
        if (!cancelled) {
          setProducts(limit > 0 ? data.products.slice(0, limit) : data.products);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load products');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [limit]);

  const findKeyProduct = useCallback((): Product | undefined => {
    const prime = products.find((product) => product.sku === 'KEY-CS2-PRIME');
    if (prime) {
      return prime;
    }

    return products.find((product) => product.type === 'key');
  }, [products]);

  return {
    products,
    loading,
    error,
    findKeyProduct,
  };
}
