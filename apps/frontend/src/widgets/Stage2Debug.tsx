import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useProducts } from '#/features/order/useProducts';
import { apiFetch, getAdminToken } from '#/shared/api/client';
import { formatPrice } from '#/shared/data/home';
import { getBuyerId, rotateBuyerId } from '#/shared/lib/buyer';
import type { Order } from '#/shared/types';

import styles from './Stage2Debug.module.css';

const DEFAULT_SKU = 'KEY-CS2-PRIME';

function adminHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getAdminToken()}` };
}

export function Stage2Debug() {
  const [params] = useSearchParams();
  const debugOn = params.get('debug') === '1';
  const { products } = useProducts(0);
  const orderId = params.get('id');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [buyerId, setBuyerId] = useState(() => getBuyerId());
  const [orderSku, setOrderSku] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrderSku(null);
      return;
    }

    let cancelled = false;
    void apiFetch<{ order: Order }>(`/api/orders/${orderId}`)
      .then((data) => {
        if (!cancelled) {
          setOrderSku(data.order.sku);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOrderSku(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const sku = orderSku ?? products.find((item) => item.sku === DEFAULT_SKU)?.sku ?? products[0]?.sku ?? DEFAULT_SKU;
  const live = products.find((item) => item.sku === sku);

  if (debugOn === false) {
    return null;
  }

  const run = async (label: string, path: string) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setStatus(label);
    try {
      await apiFetch(path, {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ sku }),
      });
      setStatus('ok');
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'ошибка');
    } finally {
      setBusy(false);
    }
  };

  const secondBuyer = async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    setStatus('второй покупатель…');
    try {
      const nextId = rotateBuyerId();
      setBuyerId(nextId);
      await apiFetch('/api/debug/second-buyer', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ sku }),
      });
      setStatus(`ok · ${nextId.slice(0, 12)}`);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className={styles.wrap} data-debug="stage2">
      <p className={styles.title}>debug=1</p>
      <p className={styles.meta}>
        {sku}
        {live ? ` · ${formatPrice(live.price, live.currency)} · остаток ${live.available}` : ''}
        {orderId ? ` · заказ` : ''}
      </p>
      <p className={styles.buyer}>buyer {buyerId.slice(0, 16)}</p>
      <div className={styles.grid}>
        <button type="button" disabled={busy} onClick={() => void run('сток…', '/api/debug/stock-one')}>
          Сток = 1
        </button>
        <button type="button" disabled={busy} onClick={() => void run('цена…', '/api/debug/price')}>
          Цена +100
        </button>
        <button type="button" disabled={busy} onClick={() => void run('холд…', '/api/debug/reset-hold')}>
          Сброс холда
        </button>
        <button type="button" disabled={busy} onClick={() => void secondBuyer()}>
          Второй покупатель
        </button>
      </div>
      {status ? <p className={styles.status}>{status}</p> : null}
    </aside>
  );
}
