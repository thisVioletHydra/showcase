import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch, getAdminToken } from '#/shared/api/client';
import {
  loadLastOrderId,
  subscribeLastOrder,
} from '#/shared/lib/orderDisplay';

import styles from './DebugPanel.module.css';

interface PromoRow {
  code: string;
  type: 'percent' | 'amount';
  value: number;
  max_uses: number;
  used_count: number;
}

function adminHeaders(): HeadersInit {
  return { Authorization: `Bearer ${getAdminToken()}` };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatPromo(row: PromoRow): string {
  const deal = row.type === 'percent' ? `−${row.value}%` : `−${row.value}₽`;
  return `${deal} ${row.used_count}/${row.max_uses}`;
}

export function DebugPanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('debug');
  const [lastOrderId, setLastOrderId] = useState<string | null>(() => loadLastOrderId());
  const [promos, setPromos] = useState<PromoRow[]>([]);

  const refreshLastOrder = useCallback(() => {
    setLastOrderId(loadLastOrderId());
  }, []);

  useEffect(() => {
    return subscribeLastOrder(refreshLastOrder);
  }, [refreshLastOrder]);

  const loadPromos = useCallback(async () => {
    try {
      const data = await apiFetch<{ promocodes: PromoRow[] }>('/api/admin/promocodes', {
        headers: adminHeaders(),
      });
      setPromos(data.promocodes);
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'промо не загрузились');
    }
  }, []);

  const pingHealth = useCallback(async (): Promise<boolean> => {
    try {
      await apiFetch('/api/products');
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    void pingHealth().then((alive) => {
      setStatus(alive ? 'бэк живой' : 'бэк молчит');
    });
    void loadPromos();
  }, [open, loadPromos, pingHealth]);

  const run = async (label: string, action: () => Promise<void>) => {
    if (busy) {
      return;
    }

    setBusy(true);
    setStatus(label);
    try {
      await action();
    } catch (err: unknown) {
      setStatus(err instanceof Error ? err.message : 'ошибка');
    } finally {
      setBusy(false);
    }
  };

  const setSuppliers = (errorRate: number, timeoutRate: number, okLabel: string) => {
    void run('поставщики…', async () => {
      await apiFetch('/api/admin/suppliers/config', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ errorRate, timeoutRate }),
      });
      setStatus(okLabel);
    });
  };

  const addKey = () => {
    void run('ключ…', async () => {
      const code = `DBG-${Date.now().toString(36).toUpperCase()}`;
      const result = await apiFetch<{ inserted: number }>('/api/admin/keys', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({ codes: [code] }),
      });
      setStatus(result.inserted ? `+ ${code}` : 'ключ уже был');
    });
  };

  const restartBackend = () => {
    const ok = window.confirm(
      'Бэкенд сейчас упадёт и должен подняться сам примерно через 10 секунд.\n\n'
      + 'На это время API не отвечает. Продолжить?',
    );
    if (!ok) {
      return;
    }

    void run('роняем бэк…', async () => {
      try {
        await apiFetch('/api/admin/debug/restart', {
          method: 'POST',
          headers: adminHeaders(),
        });
      } catch {
        // процесс мог умереть до ответа
      }

      setStatus('ждём бэк…');
      for (let i = 0; i < 40; i += 1) {
        await sleep(250);
        if (await pingHealth()) {
          setStatus('бэк поднялся');
          await loadPromos();
          return;
        }
      }

      setStatus('бэк не поднялся');
    });
  };

  const copyPromo = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus(`скопировал ${code}`);
    } catch {
      setStatus('не скопировалось');
    }
  };

  return (
    <div className={styles.wrap}>
      {open ? (
        <div className={styles.card}>
          <div className={styles.head}>
            <strong>TZ debug</strong>
            <button type="button" className={styles.iconBtn} onClick={() => setOpen(false)}>
              ×
            </button>
          </div>

          <p className={styles.status}>{status}</p>

          <div className={styles.grid}>
            <button type="button" disabled={busy} onClick={() => navigate('/admin')}>
              Админка
            </button>
            <button
              type="button"
              disabled={busy || !lastOrderId}
              onClick={() => {
                if (lastOrderId) {
                  navigate(`/order?id=${lastOrderId}`);
                }
              }}
            >
              Последний заказ
            </button>
            <button type="button" disabled={busy} onClick={() => setSuppliers(1, 0, 'fail 100%')}>
              Fail поставщиков
            </button>
            <button type="button" disabled={busy} onClick={() => setSuppliers(0, 1, 'timeout 100%')}>
              Timeout
            </button>
            <button type="button" disabled={busy} onClick={() => setSuppliers(0, 0, 'поставщики OK')}>
              Поставщики OK
            </button>
            <button type="button" disabled={busy} onClick={addKey}>
              + ключ
            </button>
            <button
              type="button"
              className={styles.danger}
              disabled={busy}
              onClick={restartBackend}
            >
              Ронять бэк
            </button>
          </div>

          <p className={styles.sectionLabel}>Промокоды</p>
          <ul className={styles.promos}>
            {promos.length === 0 ? (
              <li className={styles.empty}>нет данных</li>
            ) : (
              promos.map((row) => (
                <li key={row.code}>
                  <button
                    type="button"
                    className={styles.promoBtn}
                    onClick={() => void copyPromo(row.code)}
                  >
                    <span>{row.code}</span>
                    <span>{formatPromo(row)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <button type="button" className={styles.chip} onClick={() => setOpen(true)}>
          DEBUG_MENU
        </button>
      )}
    </div>
  );
}
