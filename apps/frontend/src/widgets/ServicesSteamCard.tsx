import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SERVICE_ITEMS } from '#/shared/data/home';
import { useCurrency } from '#/features/currency/useCurrency';
import { apiFetch } from '#/shared/api/client';
import { saveLastOrderId, saveOrderDisplay } from '#/shared/lib/orderDisplay';
import { assetUrl } from '#/shared/lib/assetUrl';
import type { CreateOrderResponse } from '#/shared/types';

import styles from './ServicesSteamCard.module.css';

/** Единственный topup-SKU в каталоге с кастомной суммой — биллинг идёт через него. */
const TOPUP_SKU = 'STEAM-TOPUP-500';
const DEFAULT_AMOUNT = 500;
const MIN_AMOUNT = 500;
const MAX_AMOUNT = 20_000;

const MORE_POCKET = [
  { id: 'ps-plus', label: 'PS Plus' },
  { id: 'ps-store', label: 'PS Store' },
  { id: 'ps-stars', label: 'PS Stars' },
  { id: 'ps-now', label: 'PS Now' },
  { id: 'ps-ea', label: 'EA Play' },
  { id: 'ps-wallet', label: 'PS Wallet' },
] as const;

const PS_ICON = assetUrl('assets/webp/services/playstation.webp');

function parseAmountInput(raw: string): number | null {
  const normalized = raw.replace(',', '.').trim();
  if (!normalized) {
    return null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 1) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function ServicesSteamCard() {
  const navigate = useNavigate();
  const { currency, currencies, label, labels, select } = useCurrency('USD');
  const [selectedId, setSelectedId] = useState('steam');
  const [login, setLogin] = useState('');
  const [amountInput, setAmountInput] = useState(String(DEFAULT_AMOUNT));
  const [promoOpen, setPromoOpen] = useState(false);
  const [promo, setPromo] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const moreWrapRef = useRef<HTMLDivElement>(null);

  const selected = SERVICE_ITEMS.find((item) => item.id === selectedId) ?? SERVICE_ITEMS[0];
  const parsedAmount = parseAmountInput(amountInput);
  const amountReady = parsedAmount !== null
    && parsedAmount >= MIN_AMOUNT
    && parsedAmount <= MAX_AMOUNT;
  const amountWarn = amountInput.trim() !== '' && !amountReady;
  const payLabelAmount = parsedAmount ?? MIN_AMOUNT;
  const amountText = `${payLabelAmount}${label}`;
  const loginPlaceholder = `Логин ${selected.label}`;
  const payDisabled = busy || !amountReady;

  useEffect(() => {
    if (!moreOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const root = moreWrapRef.current;
      if (root && !root.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [moreOpen]);

  const pickService = (id: string) => {
    setSelectedId(id);
    setMoreOpen(false);
  };

  const onPay = async () => {
    if (busy) {
      return;
    }

    if (!login.trim()) {
      setError(`Введи логин ${selected.label}`);
      return;
    }

    const parsed = parseAmountInput(amountInput);
    if (parsed === null || parsed < MIN_AMOUNT || parsed > MAX_AMOUNT) {
      setError(`Сумма от ${MIN_AMOUNT} до ${MAX_AMOUNT}`);
      return;
    }

    const amountValue = parsed;

    setBusy(true);
    setError(null);

    try {
      const body: { sku: string; amount: number; currency: string; promocode?: string } = {
        sku: TOPUP_SKU,
        amount: amountValue,
        currency,
      };

      if (promo.trim()) {
        body.promocode = promo.trim();
      }

      const result = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      saveOrderDisplay(result.order_id, {
        label: selected.label,
        icon: selected.icon ?? assetUrl('assets/webp/services/steam.webp'),
      });
      saveLastOrderId(result.order_id);

      navigate(`/order?id=${result.order_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Не удалось создать заказ');
      setBusy(false);
    }
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.servicesRow}>
            {SERVICE_ITEMS.map((service) => {
              const isMore = service.id === 'more';
              const active = selectedId === service.id || (isMore && moreOpen);

              if (isMore) {
                return (
                  <div key={service.id} className={styles.moreWrap} ref={moreWrapRef}>
                    <button
                      type="button"
                      className={`${styles.serviceBtn} ${active ? styles.serviceBtnActive : ''}`}
                      aria-expanded={moreOpen}
                      aria-haspopup="true"
                      onClick={() => setMoreOpen((open) => !open)}
                    >
                      <span className={styles.serviceIcon}>
                        <img src={service.icon} alt="" />
                      </span>
                      <span className={styles.serviceLabel}>{service.label}</span>
                    </button>

                    {moreOpen ? (
                      <div className={styles.morePocket} role="menu">
                        <p className={styles.morePocketTitle}>Ещё сервисы</p>
                        <div className={styles.morePocketGrid}>
                          {MORE_POCKET.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              className={styles.morePocketItem}
                              role="menuitem"
                              onClick={() => pickService('ps')}
                            >
                              <img src={PS_ICON} alt="" width={48} height={48} />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <button
                  key={service.id}
                  type="button"
                  className={`${styles.serviceBtn} ${active ? styles.serviceBtnActive : ''}`}
                  onClick={() => pickService(service.id)}
                >
                  <span className={styles.serviceIcon}>
                    <img src={service.icon} alt="" />
                  </span>
                  <span className={styles.serviceLabel}>{service.label}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.divider} />

          <div className={styles.steamBlock}>
            <div className={styles.appInfo}>
              <div className={styles.appIconRing}>
                <img src={selected.icon} alt="" className={styles.appIcon} />
              </div>
              <div className={styles.appMeta}>
                <div className={styles.appTitleRow}>
                  <span className={styles.steamTitle}>Пополнение {selected.label}</span>
                  <span className={styles.badge}>5%</span>
                </div>
                {promoOpen ? (
                  <input
                    className={styles.promoInput}
                    type="text"
                    value={promo}
                    placeholder="Промокод"
                    onChange={(event) => setPromo(event.target.value)}
                  />
                ) : (
                  <button
                    type="button"
                    className={styles.promoBtn}
                    onClick={() => setPromoOpen(true)}
                  >
                    Ввести промокод
                    <img src={assetUrl('assets/svg/chevron.svg')} alt="" width={12} height={12} />
                  </button>
                )}
              </div>
            </div>

            <label className={styles.loginField}>
              <img src={assetUrl('assets/svg/profile.svg')} alt="" width={20} height={20} />
              <input
                type="text"
                value={login}
                placeholder={loginPlaceholder}
                onChange={(event) => {
                  setLogin(event.target.value);
                  if (error) {
                    setError(null);
                  }
                }}
              />
              <button type="button" className={styles.infoBtn} aria-label="Info">
                <img src={assetUrl('assets/svg/info.svg')} alt="" width={5} height={12} />
              </button>
            </label>

            <div className={styles.amountCol}>
              <div className={`${styles.amountField} ${amountWarn ? styles.amountFieldWarn : ''}`}>
                <div className={styles.amountLead}>
                  <span className={styles.amountGlyph} aria-hidden="true">{label}</span>
                  <div className={styles.amountText}>
                    <span className={styles.amountLabel}>Сумма</span>
                    <input
                      className={styles.amountInput}
                      type="text"
                      inputMode="decimal"
                      value={amountInput}
                      aria-label="Сумма пополнения"
                      aria-invalid={amountWarn}
                      onChange={(event) => {
                        const next = event.target.value.replace(/[^\d.,]/g, '');
                        const parsed = parseAmountInput(next);
                        setAmountInput(parsed !== null && parsed > MAX_AMOUNT ? String(MAX_AMOUNT) : next);
                        if (error) {
                          setError(null);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className={styles.currencyGroup} role="group" aria-label="Валюта">
                  {currencies.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={`${styles.currencyPill} ${currency === code ? styles.currencyPillActive : ''}`}
                      aria-pressed={currency === code}
                      onClick={() => select(code)}
                    >
                      {labels[code]}
                    </button>
                  ))}
                </div>
              </div>
              {amountWarn ? (
                <p className={styles.amountHint}>
                  Минимум {MIN_AMOUNT}&nbsp;{label}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              className={styles.payBtn}
              disabled={payDisabled}
              onClick={() => void onPay()}
            >
              {busy ? 'Создаём…' : `Оплатить ${amountText}`}
            </button>
          </div>

          {error ? <p className={styles.formError}>{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
