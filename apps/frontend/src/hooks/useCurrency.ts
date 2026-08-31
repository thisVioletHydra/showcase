import { useCallback, useState } from 'react';

import type { CurrencyCode } from '@/types';

const CURRENCIES: CurrencyCode[] = ['USD', 'KZT', 'RUB'];

const LABELS: Record<CurrencyCode, string> = {
  USD: '$',
  KZT: '₸',
  RUB: '₽',
};

export function useCurrency(initial: CurrencyCode = 'RUB') {
  const [currency, setCurrency] = useState<CurrencyCode>(initial);

  const select = useCallback((code: CurrencyCode) => {
    setCurrency(code);
  }, []);

  return {
    currency,
    currencies: CURRENCIES,
    label: LABELS[currency],
    select,
    labels: LABELS,
  };
}
