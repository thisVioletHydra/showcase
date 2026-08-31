import { useCallback, useEffect, useState } from 'react';

import { apiFetch } from '@/api/client';
import type { Product } from '@/types';

interface ProductsResponse {
  products: Product[];
}

export function useProducts(limit = 5) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void apiFetch<ProductsResponse>('/api/products')
      .then((data) => {
        if (!cancelled) {
          setProducts(data.products.slice(0, limit));
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
