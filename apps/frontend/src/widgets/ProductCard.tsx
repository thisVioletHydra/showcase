import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { claimProductOrder } from '#/features/order/claimOrder';
import { isSoldOutError, soldOutNeighbor } from '#/shared/api/client';
import { displayProductName, formatPrice, resolveProductImage, strikePrice } from '#/shared/data/home';
import { assetUrl } from '#/shared/lib/assetUrl';
import { clearPendingOrderId } from '#/shared/lib/buyer';
import { withDebugQuery } from '#/shared/lib/debugQuery';
import type { Product } from '#/shared/types';

import styles from './ProductCard.module.css';

interface ProductCardProps {
  product: Product;
  purchasable?: boolean;
}

export function ProductCard({ product, purchasable = false }: ProductCardProps) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [neighbor, setNeighbor] = useState<Product | null>(null);

  const onBuy = async () => {
    if (!purchasable || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setNeighbor(null);

    try {
      const result = await claimProductOrder({ sku: product.sku });
      navigate(withDebugQuery(`/order?id=${result.order_id}`));
    } catch (err: unknown) {
      if (isSoldOutError(err)) {
        clearPendingOrderId(product.sku);
        setNeighbor(soldOutNeighbor(err));
        setError(err instanceof Error ? err.message : 'Товар закончился');
      } else {
        setError(err instanceof Error ? err.message : 'Order failed');
      }
      setBusy(false);
    }
  };

  const cover = resolveProductImage(product.image, product.sku);
  const title = displayProductName(product.name);
  const oldPrice = strikePrice(product.price);
  const inStock = product.available > 0;
  const canBuy = purchasable && inStock;
  const soldOut = purchasable && inStock === false;

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
        <p className={styles.stock}>
          {inStock ? `Осталось ${product.available}` : 'Нет в наличии'}
        </p>
        {canBuy ? (
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
            {soldOut ? 'Нет в наличии' : 'Купить'}
          </button>
        )}
        {error ? <p className={styles.error}>{error}</p> : null}
        {neighbor ? (
          <div className={styles.neighbor}>
            <p className={styles.neighborLabel}>Рядом в каталоге</p>
            <p className={styles.neighborHint}>
              {displayProductName(neighbor.name)} — {formatPrice(neighbor.price, neighbor.currency)}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
