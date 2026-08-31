import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '#/shared/api/client';
import { displayProductName, formatPrice, resolveProductImage, strikePrice } from '#/shared/data/home';
import { assetUrl } from '#/shared/lib/assetUrl';
import { saveLastOrderId } from '#/shared/lib/orderDisplay';
import type { CreateOrderResponse, Product } from '#/shared/types';

import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  index?: number;
  purchasable?: boolean;
}

export function ProductCard({ product, index = 0, purchasable = false }: ProductCardProps) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onBuy = async () => {
    if (!purchasable || busy) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await apiFetch<CreateOrderResponse>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ sku: product.sku }),
      });
      saveLastOrderId(result.order_id);
      navigate(`/order?id=${result.order_id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Order failed');
      setBusy(false);
    }
  };

  const cover = resolveProductImage(product.image, product.sku);
  const title = displayProductName(product.name);
  const oldPrice = strikePrice(product.price);

  return (
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={cover} alt="" className={styles.cover} />
      </div>
      <div className={styles.body}>
        <div className={styles.platform}>
          <img src={assetUrl('assets/svg/steam.svg')} alt="" width={16} height={16} />
          <span className={styles.platformText}>{title.toUpperCase()}</span>
        </div>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price, product.currency)}</span>
          <span className={styles.strike}>{formatPrice(oldPrice, product.currency)}</span>
        </div>
        {purchasable ? (
          <button
            type="button"
            className={styles.buyBtn}
            disabled={busy}
            onClick={() => void onBuy()}
          >
            {busy ? '…' : 'Купить'}
          </button>
        ) : (
          <button type="button" className={styles.buyBtnMuted} disabled>
            Купить
          </button>
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
      </div>
    </article>
  );
}
