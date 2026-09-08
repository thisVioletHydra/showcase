import { useEffect, useRef, useState } from 'react';

import { apiFetch, isAbortError } from '#/shared/api/client';
import type { CatalogSearchResponse, Product } from '#/shared/types';

interface CatalogSearchState {
  products: Product[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useCatalogSearch(q: string, type: string, limit = 50): CatalogSearchState {
  const needle = q.trim();
  const active = needle.length > 0 || type.length > 0;
  const generationRef = useRef(0);
  const [state, setState] = useState<CatalogSearchState>({
    products: [],
    total: 0,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    if (active === false) {
      setState({
        products: [],
        total: 0,
        loading: false,
        error: null,
      });
      return;
    }

    const controller = new AbortController();
    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    const params = new URLSearchParams();
    if (needle) {
      params.set('q', needle);
    }
    if (type) {
      params.set('type', type);
    }
    params.set('limit', String(limit));
    params.set('offset', '0');

    void apiFetch<CatalogSearchResponse>(`/api/products?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((data) => {
        if (generation !== generationRef.current) {
          return;
        }

        setState({
          products: data.products,
          total: typeof data.total === 'number' ? data.total : data.products.length,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (isAbortError(error) || generation !== generationRef.current) {
          return;
        }

        setState({
          products: [],
          total: 0,
          loading: false,
          error: error instanceof Error ? error.message : 'Поиск не удался',
        });
      });

    return () => {
      controller.abort();
    };
  }, [active, needle, type, limit]);

  return state;
}
