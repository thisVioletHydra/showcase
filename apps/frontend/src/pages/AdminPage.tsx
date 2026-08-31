import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch, getAdminToken } from '@/api/client';
import { formatPrice } from '@/data/home';
import type { Order } from '@/types';

import styles from './AdminPage.module.css';

interface AdminOrdersResponse {
  orders: Order[];
}

interface AdminKeysResponse {
  inserted: number;
  total: number;
}

export function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [keysInput, setKeysInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const authHeaders = {
    Authorization: `Bearer ${getAdminToken()}`,
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<AdminOrdersResponse>(
        '/api/admin/orders?status=out_of_stock,delivery_failed,paid',
        { headers: authHeaders },
      );
      setOrders(data.orders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleRetry = async (orderId: string) => {
    setMessage(null);
    setError(null);

    try {
      await apiFetch(`/api/admin/orders/${orderId}/retry-delivery`, {
        method: 'POST',
        headers: authHeaders,
      });
      setMessage(`Retry queued for ${orderId}`);
      await loadOrders();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Retry failed');
    }
  };

  const handleAddKeys = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const codes = keysInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (codes.length === 0) {
      setError('Enter at least one key');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const result = await apiFetch<AdminKeysResponse>('/api/admin/keys', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ codes }),
      });

      setMessage(`Добавлено ключей: ${result.inserted} из ${result.total}`);
      setKeysInput('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add keys');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={`container ${styles.container}`}>
        <Link to="/" className={styles.back}>
          ← На главную
        </Link>

        <h1 className={styles.title}>Admin</h1>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <h2>Заказы</h2>
            <button type="button" onClick={() => void loadOrders()}>
              Обновить
            </button>
          </div>

          {loading ? <p>Загрузка…</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}
          {message ? <p className={styles.message}>{message}</p> : null}

          {!loading && orders.length === 0 ? (
            <p className={styles.empty}>Нет заказов в выбранных статусах</p>
          ) : null}

          <ul className={styles.orderList}>
            {orders.map((order) => (
              <li key={order.id} className={styles.orderItem}>
                <div>
                  <p className={styles.orderId}>{order.id}</p>
                  <p className={styles.orderMeta}>
                    {order.sku} · {order.status} · {formatPrice(order.amount, order.currency)}
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={() => void handleRetry(order.id)}
                >
                  Retry delivery
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.card}>
          <h2>Добавить ключи</h2>
          <form className={styles.keysForm} onSubmit={(event) => void handleAddKeys(event)}>
            <textarea
              value={keysInput}
              placeholder="KEY-001&#10;KEY-002"
              rows={6}
              onChange={(event) => setKeysInput(event.target.value)}
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Отправка…' : 'Добавить'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
