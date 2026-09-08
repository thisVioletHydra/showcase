export const SEARCH_PRODUCT_TYPES = ['key', 'topup', 'subscription', 'giftcard'] as const;

export type SearchProductType = (typeof SEARCH_PRODUCT_TYPES)[number];

export const SEARCH_TYPE_CHIPS: Array<{ id: SearchProductType | ''; label: string }> = [
  { id: '', label: 'Все' },
  { id: 'key', label: 'Ключи' },
  { id: 'topup', label: 'Пополнение' },
  { id: 'subscription', label: 'Подписки' },
  { id: 'giftcard', label: 'Карты' },
];

export function parseSearchType(raw: string | null | undefined): SearchProductType | '' {
  if (raw && (SEARCH_PRODUCT_TYPES as readonly string[]).includes(raw)) {
    return raw as SearchProductType;
  }

  return '';
}

export function isSearchActive(q: string, type: string): boolean {
  return q.trim().length > 0 || type.length > 0;
}

export function readSearchQuery(params: URLSearchParams): string {
  return params.get('q') ?? '';
}

export function withPreservedDebug(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams();
  if (params.get('debug') === '1') {
    next.set('debug', '1');
  }
  return next;
}
