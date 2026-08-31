import { useState } from 'react';

import { SERVICE_ITEMS } from '@/data/home';
import { useCurrency } from '@/hooks/useCurrency';

import styles from './ServicesSteamCard.module.css';

export function ServicesSteamCard() {
  const { currency, currencies, labels, select } = useCurrency('RUB');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [login, setLogin] = useState('');

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.servicesRow}>
            {SERVICE_ITEMS.map((service) => (
              <button
                key={service.id}
                type="button"
                className={`${styles.serviceBtn} ${activeId === service.id ? styles.serviceBtnActive : ''}`}
                onMouseEnter={() => setActiveId(service.id)}
                onMouseLeave={() => setActiveId(null)}
                onFocus={() => setActiveId(service.id)}
                onBlur={() => setActiveId(null)}
              >
                <span className={styles.serviceIcon}>
                  {service.icon ? (
                    <img src={service.icon} alt="" />
                  ) : (
                    <span className={styles.moreLabel}>{service.label}</span>
                  )}
                </span>
                {service.icon ? <span className={styles.serviceLabel}>{service.label}</span> : null}
              </button>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.steamBlock}>
            <div className={styles.steamHead}>
              <div className={styles.steamTitleRow}>
                <img src="/assets/steam.svg" alt="" className={styles.steamLogo} />
                <span className={styles.steamTitle}>Пополнение Steam</span>
                <span className={styles.badge}>5%</span>
              </div>
              <button type="button" className={styles.promoDecor}>Ввести промокод</button>
            </div>

            <div className={styles.steamForm}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Логин Steam</span>
                <span className={styles.inputWrap}>
                  <input
                    type="text"
                    value={login}
                    placeholder="Введите логин"
                    onChange={(event) => setLogin(event.target.value)}
                  />
                  <button type="button" className={styles.infoBtn} aria-label="Info">
                    <img src="/assets/icon-info.png" alt="" width={20} height={20} />
                  </button>
                </span>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>Сумма</span>
                <input type="text" value="500 ₽" readOnly />
              </label>

              <div className={styles.currencyGroup}>
                {currencies.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`${styles.currencyPill} ${currency === code ? styles.currencyPillActive : ''}`}
                    onClick={() => select(code)}
                  >
                    {labels[code]}
                  </button>
                ))}
              </div>

              <button type="button" className={styles.payBtn}>Оплатить 500$</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
