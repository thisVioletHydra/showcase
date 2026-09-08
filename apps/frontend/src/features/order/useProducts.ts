import { useCallback, useEffect, useState } from 'react';

import { getCachedProducts, subscribeProducts } from '#/features/order/productsCatalog';
import type { Product } from '#/shared/types';

function sliceProducts(products: Product[], limit: number): Product[] {
  return limit > 0 ? products.slice(0, limit) : products;
}

/** `limit <= 0` — весь каталог с API / SSE. */
export function useProducts(limit = 5) {
  const cached = getCachedProducts();
  const [products, setProducts] = useState<Product[]>(() =>
    cached ? sliceProducts(cached, limit) : [],
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeProducts((fresh) => {
      setProducts(sliceProducts(fresh, limit));
      setLoading(false);
      setError(null);
    });
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
