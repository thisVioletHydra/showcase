import { useState } from 'react';

import { FILTER_PILLS } from '@/data/home';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types';

import { ProductCard } from './ProductCard';
import styles from './ProductSection.module.css';

interface ProductSectionProps {
  title: string;
  showFilters?: boolean;
  showAllLink?: boolean;
  sliceStart?: number;
  sliceEnd?: number;
  productsOverride?: Product[];
}

export function ProductSection({
  title,
  showFilters = false,
  showAllLink = false,
  sliceStart = 0,
  sliceEnd = 5,
  productsOverride,
}: ProductSectionProps) {
  const { products, loading, error, findKeyProduct } = useProducts(12);
  const [activeFilter] = useState('Донат');
  const keyProduct = findKeyProduct();
  const rows = productsOverride ?? products.slice(sliceStart, sliceEnd);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {showAllLink ? <a href="#" className="sectionLink">Показать все</a> : null}
        </div>

        {showFilters ? (
          <div className={styles.filters}>
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill}
                type="button"
                className={`${styles.filter} ${pill === activeFilter ? styles.filterActive : ''}`}
              >
                {pill}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? <p className={styles.message}>Загрузка…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error ? (
          <div className={styles.grid}>
            {rows.map((product, index) => (
              <ProductCard
                key={`${title}-${product.sku}-${index}`}
                product={product}
                index={sliceStart + index}
                purchasable={product.sku === keyProduct?.sku && title === 'Популярные товары'}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
