import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch, getAdminToken } from '#/shared/api/client';
import { formatPrice } from '#/shared/data/home';
import type { Order } from '#/shared/types';

import styles from './AdminPage.module.css';

interface AdminOrdersResponse {
  orders: Order[];
}

interface AdminKeysResponse {
  inserted: number;
  total: number;
}

const STATUS_FILTERS = [
  { id: 'undelivered', label: 'Не выданы', query: 'out_of_stock,delivery_failed,paid' },
  { id: 'created', label: 'Не оплачены', query: 'created' },
  { id: 'delivered', label: 'Выданы', query: 'delivered' },
  { id: 'failed', label: 'Оплата fail', query: 'payment_failed' },
] as const;

/** Примерная высота строки заказа в listPanel (padding + 2 строки текста). */
const ORDER_ROW_H = 52;

type PageSizeId = 's' | 'm' | 'l' | 'xl';

const PAGE_SIZE_BTNS: { id: PageSizeId; label: string }[] = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
  { id: 'xl', label: 'XL' },
];

function resolvePageSize(id: PageSizeId, fitCount: number): number {
  if (id === 's') {
    return fitCount;
  }
  if (id === 'm') {
    return Math.max(fitCount * 2, 25);
  }
  if (id === 'l') {
    return 50;
  }
  return 100;
}

export function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterId, setFilterId] = useState<(typeof STATUS_FILTERS)[number]['id']>('undelivered');
  const [pageSizeId, setPageSizeId] = useState<PageSizeId>('s');
  const [page, setPage] = useState(0);
  const [fitCount, setFitCount] = useState(12);
  const [keysInput, setKeysInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const listPanelRef = useRef<HTMLDivElement>(null);

  const authHeaders = {
    Authorization: `Bearer ${getAdminToken()}`,
  };

  const activeFilter = STATUS_FILTERS.find((item) => item.id === filterId) ?? STATUS_FILTERS[0];
  const pageSize = resolvePageSize(pageSizeId, fitCount);

  useEffect(() => {
    const panel = listPanelRef.current;
    if (!panel) {
      return;
    }

    const updateFit = () => {
      const next = Math.max(5, Math.floor(panel.clientHeight / ORDER_ROW_H));
      setFitCount(next);
    };

    updateFit();
    const observer = new ResizeObserver(updateFit);
    observer.observe(panel);
    return () => observer.disconnect();
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch<AdminOrdersResponse>(
        `/api/admin/orders?status=${encodeURIComponent(activeFilter.query)}`,
        { headers: authHeaders },
      );
      setOrders(data.orders);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [activeFilter.query]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(0);
  }, [filterId, pageSizeId, fitCount]);

  const pageCount = Math.max(1, Math.ceil(orders.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);

  const pageOrders = useMemo(() => {
    const start = safePage * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, safePage, pageSize]);

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

  const canRetry = filterId === 'undelivered';
  const from = orders.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(orders.length, (safePage + 1) * pageSize);

  return (
    <div className={`page ${styles.page}`}>
      <div className={`container ${styles.container}`}>
        <header className={styles.topBar}>
          <div className={styles.topLeft}>
            <Link to="/" className={styles.back}>
              ← На главную
            </Link>
            <h1 className={styles.title}>Admin</h1>
          </div>
          <button type="button" className={styles.refreshBtn} onClick={() => void loadOrders()}>
            Обновить
          </button>
        </header>

        <div className={styles.layout}>
          <section className={`${styles.card} ${styles.ordersCard}`}>
            <div className={styles.cardHead}>
              <h2>Заказы</h2>
              <div className={styles.sizeGroup} role="group" aria-label="Размер страницы">
                {PAGE_SIZE_BTNS.map((item) => {
                  const size = resolvePageSize(item.id, fitCount);
                  const title = item.id === 's' || item.id === 'm'
                    ? `${size} на экран`
                    : `${size} на странице`;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`${styles.sizeBtn} ${pageSizeId === item.id ? styles.sizeBtnActive : ''}`}
                      title={title}
                      onClick={() => setPageSizeId(item.id)}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.filters}>
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.filterBtn} ${filterId === item.id ? styles.filterBtnActive : ''}`}
                  onClick={() => setFilterId(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}
            {message ? <p className={styles.message}>{message}</p> : null}

            <div className={styles.listPanel} ref={listPanelRef}>
              {loading ? (
                <p className={styles.panelHint}>Загрузка…</p>
              ) : orders.length === 0 ? (
                <div className={styles.emptyState}>
                  <p className={styles.emptyTitle}>Пусто</p>
                  <p className={styles.empty}>Нет заказов в выбранных статусах</p>
                </div>
              ) : (
                <ul className={styles.orderList}>
                  {pageOrders.map((order) => (
                    <li key={order.id} className={styles.orderItem}>
                      <div className={styles.orderMain}>
                        <p className={styles.orderId}>{order.id}</p>
                        <p className={styles.orderMeta}>
                          {order.sku} · {order.status} · {formatPrice(order.amount, order.currency)}
                        </p>
                      </div>
                      {canRetry ? (
                        <button
                          type="button"
                          className={styles.retryBtn}
                          onClick={() => void handleRetry(order.id)}
                        >
                          Retry
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.pager}>
              <p className={styles.pagerMeta}>
                {orders.length === 0
                  ? '0 записей'
                  : `${from}–${to} из ${orders.length}`}
              </p>
              {pageCount > 1 ? (
                <div className={styles.pagerBtns}>
                  <button
                    type="button"
                    className={styles.pagerBtn}
                    disabled={safePage <= 0}
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                  >
                    Назад
                  </button>
                  <span className={styles.pagerPage}>
                    {safePage + 1} / {pageCount}
                  </span>
                  <button
                    type="button"
                    className={styles.pagerBtn}
                    disabled={safePage >= pageCount - 1}
                    onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
                  >
                    Дальше
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <section className={`${styles.card} ${styles.keysCard}`}>
            <h2>Ключи</h2>
            <form className={styles.keysForm} onSubmit={(event) => void handleAddKeys(event)}>
              <textarea
                value={keysInput}
                placeholder="KEY-001&#10;KEY-002"
                rows={5}
                onChange={(event) => setKeysInput(event.target.value)}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Отправка…' : 'Добавить'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
