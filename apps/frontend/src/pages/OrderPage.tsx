import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useProducts } from '#/features/order/useProducts';
import { apiFetch } from '#/shared/api/client';
import { formatPrice, displayProductName, resolveProductImage } from '#/shared/data/home';
import { loadOrderDisplay } from '#/shared/lib/orderDisplay';
import { getOrderStatusMeta, isTerminalStatus } from '#/shared/lib/orderStatus';
import type { Order } from '#/shared/types';
import { Alert } from '#/shared/ui/Alert';
import { StatusBadge } from '#/shared/ui/StatusBadge';

import styles from './OrderPage.module.css';

interface OrderResponse {
  order: Order;
}

function sameOrder(a: Order, b: Order): boolean {
  return (
    a.id === b.id
    && a.status === b.status
    && a.amount === b.amount
    && a.currency === b.currency
    && a.key_code === b.key_code
    && a.promocode === b.promocode
    && a.updated_at === b.updated_at
  );
}

export function OrderPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id');
  const { products } = useProducts(0);
  const [order, setOrder] = useState<Order | null>(null);
  const [promocode, setPromocode] = useState('');
  const [loading, setLoading] = useState(true);
  const [promoBusy, setPromoBusy] = useState(false);
  const [payLock, setPayLock] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const canPay = order?.status === 'created';
  const showKey = Boolean(order?.key_code) && order?.status === 'delivered';
  const showPayWaiting = payLock && !showKey && order?.status !== 'payment_failed';
  const showPayControls = Boolean(canPay && !payLock);
  const meta = useMemo(
    () => (order ? getOrderStatusMeta(order.status) : null),
    [order?.status],
  );

  const product = useMemo(
    () => (order ? products.find((item) => item.sku === order.sku) : undefined),
    [order?.sku, products],
  );

  const serviceDisplay = useMemo(
    () => (order ? loadOrderDisplay(order.id) : null),
    [order?.id],
  );

  const productName = useMemo(() => {
    if (serviceDisplay) {
      return `Пополнение ${serviceDisplay.label}`;
    }

    return displayProductName(product?.name ?? order?.sku ?? 'Товар');
  }, [serviceDisplay, product?.name, order?.sku]);

  const productCover = serviceDisplay?.icon
    ?? (product ? resolveProductImage(product.image, product.sku) : null);

  const basePrice = product?.price;
  const hasDiscount = Boolean(
    order
    && order.promocode
    && basePrice != null
    && order.amount < basePrice,
  );

  const amountLabel = meta?.mood === 'success'
    ? 'Оплачено'
    : meta?.mood === 'broken'
      ? 'Сумма заказа'
      : meta?.mood === 'progress'
        ? 'Списано'
        : 'К оплате';

  const applyOrder = (next: Order) => {
    setOrder((prev) => (prev && sameOrder(prev, next) ? prev : next));
  };

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Нет id заказа');
      return;
    }

    let cancelled = false;
    let timer: number | null = null;

    const stopPoll = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };

    const poll = () => {
      if (cancelled) {
        return;
      }

      void apiFetch<OrderResponse>(`/api/orders/${orderId}`)
        .then((data) => {
          if (cancelled) {
            return;
          }

          applyOrder(data.order);

          if (isTerminalStatus(data.order.status)) {
            stopPoll();
          }
        })
        .catch(() => {
          // keep polling silently
        });
    };

    const startPoll = () => {
      if (timer !== null || cancelled) {
        return;
      }

      timer = window.setInterval(poll, 2000);
    };

    const loadOrder = async () => {
      try {
        const data = await apiFetch<OrderResponse>(`/api/orders/${orderId}`);
        if (!cancelled) {
          applyOrder(data.order);
          setError(null);

          if (!isTerminalStatus(data.order.status)) {
            startPoll();
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Не удалось загрузить заказ');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadOrder();

    return () => {
      cancelled = true;
      stopPoll();
    };
  }, [orderId]);

  useEffect(() => {
    if (!order || order.status === 'created') {
      return;
    }

    setMessage(null);
    setError(null);

    if (isTerminalStatus(order.status) || order.key_code) {
      setPayLock(false);
    }
  }, [order?.status, order?.key_code]);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
  }, []);

  const waitAtLeast = (ms: number, startedAt: number) => {
    const left = ms - (Date.now() - startedAt);
    if (left <= 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, left);
    });
  };

  const handleApplyPromocode = async () => {
    if (!order || !promocode.trim() || order.promocode || promoBusy || payLock) {
      return;
    }

    setPromoBusy(true);
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetch<OrderResponse>(`/api/orders/${order.id}/promocode`, {
        method: 'POST',
        body: JSON.stringify({ promocode: promocode.trim() }),
      });
      applyOrder(data.order);
      setMessage('Промокод применён');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось применить промокод');
    } finally {
      setPromoBusy(false);
    }
  };

  const handleSimulate = async (success: boolean) => {
    if (!order || payLock || promoBusy) {
      return;
    }

    setPayLock(true);
    setMessage(null);
    setError(null);
    const startedAt = Date.now();

    try {
      await apiFetch('/api/payments/simulate', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          success,
        }),
      });

      await waitAtLeast(1000, startedAt);

      const data = await apiFetch<OrderResponse>(`/api/orders/${order.id}`);
      applyOrder(data.order);

      if (isTerminalStatus(data.order.status) || data.order.key_code) {
        setPayLock(false);
      }
    } catch (err: unknown) {
      await waitAtLeast(1000, startedAt);
      setError(err instanceof Error ? err.message : 'Симуляция оплаты не удалась');
      setPayLock(false);
    }
  };

  const handleCopyKey = async () => {
    if (!order?.key_code || copied) {
      return;
    }

    try {
      await navigator.clipboard.writeText(order.key_code);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copyTimerRef.current = null;
      }, 1800);
    } catch {
      setError('Не удалось скопировать ключ');
    }
  };

  const moodClass = meta
    ? {
        wait: styles.moodWait,
        progress: styles.moodProgress,
        success: styles.moodSuccess,
        broken: styles.moodBroken,
      }[meta.mood]
    : '';

  const titleClass = meta
    ? {
        wait: styles.titlePending,
        progress: styles.titleProgress,
        success: styles.titleSuccess,
        broken: styles.titleDanger,
      }[meta.mood]
    : '';

  const promoEmpty = !promocode.trim();

  return (
    <div className={`page ${styles.page} ${moodClass}`}>
      <div className={`container ${styles.container}`}>
        <Link to="/" className={styles.back}>
          ← На главную
        </Link>

        {loading ? <p className={styles.loading}>Загрузка…</p> : null}

        {!loading && !order && error ? (
          <Alert tone="danger">{error}</Alert>
        ) : null}

        {order && meta ? (
          <>
            <header className={styles.hero}>
              <div className={styles.heroTop}>
                <p className={styles.eyebrow}>Заказ</p>
                <StatusBadge label={meta.label} tone={meta.tone} />
              </div>

              <h1 className={`${styles.title} ${titleClass}`}>
                {meta.title}
                {meta.mood === 'progress' ? (
                  <span className={styles.pulseRing} aria-hidden />
                ) : null}
              </h1>

              <p className={styles.hint}>{meta.hint}</p>

              <div className={styles.productRow}>
                {productCover ? (
                  <img
                    className={`${styles.productThumb} ${serviceDisplay ? styles.productThumbBrand : ''}`}
                    src={productCover}
                    alt=""
                  />
                ) : (
                  <div className={styles.productThumbFallback} aria-hidden />
                )}
                <div className={styles.productText}>
                  <p className={styles.productLabel}>Вы покупаете</p>
                  <p className={styles.productName}>{productName}</p>
                </div>
              </div>

              <div className={styles.amountBlock}>
                <p className={styles.amountLabel}>{amountLabel}</p>
                <div className={styles.amountRow}>
                  {hasDiscount && basePrice != null ? (
                    <span className={styles.amountWas}>
                      {formatPrice(basePrice, order.currency)}
                    </span>
                  ) : null}
                  <p className={styles.amount}>{formatPrice(order.amount, order.currency)}</p>
                </div>
                {hasDiscount && order.promocode ? (
                  <p className={styles.amountNote}>
                    Скидка по промокоду {order.promocode}
                  </p>
                ) : null}
              </div>
            </header>

            <div className={styles.card}>
              {meta.mood === 'progress' && !showPayWaiting ? (
                <div className={styles.progressPanel}>
                  <div className={styles.spinner} aria-hidden />
                  <p>Обновляем статус…</p>
                </div>
              ) : null}

              {showKey ? (
                <div className={styles.keyTicket}>
                  <p className={styles.keyLabel}>Твой ключ</p>
                  <code className={styles.keyCode}>{order.key_code}</code>
                  <button
                    type="button"
                    className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`}
                    onClick={() => void handleCopyKey()}
                  >
                    {copied ? 'Скопировано' : 'Скопировать'}
                  </button>
                </div>
              ) : null}

              {showPayWaiting ? (
                <div className={styles.payWaiting} role="status" aria-live="polite">
                  <span className={styles.btnSpinner} aria-hidden />
                  Ожидайте…
                </div>
              ) : null}

              {showPayControls ? (
                <div className={styles.payBlock}>
                  {!order.promocode ? (
                    <>
                      <div className={styles.promoRow}>
                        <label className={styles.promoField}>
                          <span>Промокод</span>
                          <input
                            type="text"
                            value={promocode}
                            placeholder="LIMIT3"
                            disabled={promoBusy}
                            onChange={(event) => {
                              setPromocode(event.target.value.toUpperCase());
                              if (error) {
                                setError(null);
                              }
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className={`${styles.primaryBtn} ${promoBusy ? styles.busy : ''} ${promoEmpty ? styles.idleDisabled : ''}`}
                          disabled={promoBusy || promoEmpty}
                          onClick={() => void handleApplyPromocode()}
                        >
                          {promoBusy ? '…' : 'Применить'}
                        </button>
                      </div>
                      <div className={styles.alertSlot} aria-live="polite">
                        {error ? <Alert tone="danger">{error}</Alert> : null}
                        {!error && message ? <Alert tone="success">{message}</Alert> : null}
                      </div>
                    </>
                  ) : (
                    <Alert tone="info">
                      Промокод {order.promocode} учтён в сумме
                    </Alert>
                  )}

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.primaryBtn}
                      disabled={promoBusy}
                      onClick={() => void handleSimulate(true)}
                    >
                      Оплатить
                    </button>
                    <button
                      type="button"
                      className={styles.outlineBtn}
                      disabled={promoBusy}
                      onClick={() => void handleSimulate(false)}
                    >
                      Симулировать отказ
                    </button>
                  </div>
                </div>
              ) : null}

              {!isTerminalStatus(order.status) && meta.mood !== 'progress' && !showPayWaiting ? (
                <p className={styles.polling}>Статус обновится автоматически</p>
              ) : null}

              <dl className={styles.techMeta}>
                <div>
                  <dt>ID заказа</dt>
                  <dd>{order.id}</dd>
                </div>
                <div>
                  <dt>Артикул</dt>
                  <dd>{order.sku}</dd>
                </div>
                {order.promocode ? (
                  <div>
                    <dt>Промокод</dt>
                    <dd>{order.promocode}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
