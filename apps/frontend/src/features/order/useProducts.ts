import { useCallback, useEffect, useState } from 'react';

import { ensureProducts, getCachedProducts } from '#/features/order/productsCatalog';
import type { Product } from '#/shared/types';

function sliceProducts(products: Product[], limit: number): Product[] {
  return limit > 0 ? products.slice(0, limit) : products;
}

/** `limit <= 0` — весь каталог с API. */
export function useProducts(limit = 5) {
  const cached = getCachedProducts();
  const [products, setProducts] = useState<Product[]>(() =>
    cached ? sliceProducts(cached, limit) : [],
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void ensureProducts((fresh) => {
      if (!cancelled) {
        setProducts(sliceProducts(fresh, limit));
        setError(null);
      }
    })
      .then((all) => {
        if (!cancelled) {
          setProducts(sliceProducts(all, limit));
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
