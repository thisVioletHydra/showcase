import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { apiFetch } from '@/api/client';
import { formatPrice } from '@/data/home';
import type { Order } from '@/types';

import styles from './OrderPage.module.css';

interface OrderResponse {
  order: Order;
}

const TERMINAL_STATUSES = new Set([
  'delivered',
  'payment_failed',
  'out_of_stock',
  'delivery_failed',
]);

export function OrderPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const [order, setOrder] = useState<Order | null>(null);
  const [promocode, setPromocode] = useState('');
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canPay = useMemo(() => {
    return order?.status === 'created';
  }, [order]);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Order id is missing');
      return;
    }

    let cancelled = false;

    const loadOrder = async () => {
      try {
        const data = await apiFetch<OrderResponse>(`/api/orders/${orderId}`);
        if (!cancelled) {
          setOrder(data.order);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load order');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    const timer = window.setInterval(() => {
      if (cancelled) {
        return;
      }

      void apiFetch<OrderResponse>(`/api/orders/${orderId}`)
        .then((data) => {
          if (!cancelled) {
            setOrder(data.order);
          }
        })
        .catch(() => {
          // keep polling silently
        });
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [orderId]);

  const handleApplyPromocode = async () => {
    if (!order || !promocode.trim() || order.promocode || paying) {
      return;
    }

    setPaying(true);
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetch<OrderResponse>(`/api/orders/${order.id}/promocode`, {
        method: 'POST',
        body: JSON.stringify({ promocode: promocode.trim() }),
      });
      setOrder(data.order);
      setMessage('Промокод применён');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Promocode failed');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulate = async (success: boolean) => {
    if (!order || paying) {
      return;
    }

    setPaying(true);
    setMessage(null);
    setError(null);

    try {
      await apiFetch('/api/payments/simulate', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          success,
        }),
      });

      setMessage(success ? 'Оплата отправлена' : 'Оплата отклонена');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment simulation failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={`container ${styles.container}`}>
        <Link to="/" className={styles.back}>
          ← На главную
        </Link>

        <h1 className={styles.title}>Заказ</h1>

        {loading ? <p>Загрузка…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {order ? (
          <div className={styles.card}>
            <dl className={styles.meta}>
              <div>
                <dt>ID</dt>
                <dd>{order.id}</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{order.sku}</dd>
              </div>
              <div>
                <dt>Статус</dt>
                <dd>{order.status}</dd>
              </div>
              <div>
                <dt>Сумма</dt>
                <dd>{formatPrice(order.amount, order.currency)}</dd>
              </div>
              {order.key_code ? (
                <div>
                  <dt>Ключ</dt>
                  <dd className={styles.key}>{order.key_code}</dd>
                </div>
              ) : null}
            </dl>

            {canPay ? (
              <div className={styles.payBlock}>
                {!order.promocode ? (
                  <label className={styles.promoField}>
                    <span>Промокод (перед оплатой)</span>
                    <input
                      type="text"
                      value={promocode}
                      placeholder="LIMIT3"
                      onChange={(event) => setPromocode(event.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      className={styles.successBtn}
                      disabled={paying || !promocode.trim()}
                      onClick={() => void handleApplyPromocode()}
                    >
                      Применить
                    </button>
                  </label>
                ) : (
                  <p className={styles.message}>Промокод: {order.promocode}</p>
                )}

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.successBtn}
                    disabled={paying}
                    onClick={() => void handleSimulate(true)}
                  >
                    Оплатить успешно
                  </button>
                  <button
                    type="button"
                    className={styles.failBtn}
                    disabled={paying}
                    onClick={() => void handleSimulate(false)}
                  >
                    Оплатить с ошибкой
                  </button>
                </div>
              </div>
            ) : null}

            {TERMINAL_STATUSES.has(order.status) ? (
              <p className={styles.final}>Заказ завершён: {order.status}</p>
            ) : (
              <p className={styles.polling}>Обновление каждые 2 сек…</p>
            )}

            {message ? <p className={styles.message}>{message}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
