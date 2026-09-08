import type { Product, SoldOutPayload } from '#/shared/types';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.ok === false) {
    let message = response.statusText;
    let payload: Record<string, unknown> | null = null;

    try {
      const body = await response.json() as Record<string, unknown>;
      payload = body;
      if (typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // ignore parse errors
    }

    throw new ApiError(response.status, message, payload);
  }

  return response.json() as Promise<T>;
}

export function isAbortError(error: unknown): boolean {
  return (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError');
}

export function catalogStreamUrl(): string {
  return `${API_BASE}/api/catalog/stream`;
}

export function getAdminToken(): string {
  return import.meta.env.VITE_ADMIN_TOKEN ?? 'dev-admin-token';
}

export function isSoldOutError(error: unknown): error is ApiError & { payload: SoldOutPayload } {
  if (!(error instanceof ApiError) || error.payload === null) {
    return false;
  }

  return error.payload.code === 'sold_out';
}

export function soldOutNeighbor(error: unknown): Product | null {
  if (!isSoldOutError(error)) {
    return null;
  }

  const neighbor = error.payload.neighbor;
  if (neighbor === null || typeof neighbor.sku !== 'string' || typeof neighbor.name !== 'string') {
    return null;
  }

  return neighbor;
}
