import { useState, type ComponentType } from 'react';

import {
  FilterAccountsIcon,
  FilterCurrencyIcon,
  FilterDonatIcon,
  FilterItemsIcon,
  FilterKeysIcon,
  FilterOtherIcon,
  FilterSubsIcon,
} from '#/shared/ui/icons/FilterPillIcons';
import { FILTER_PILLS, type FilterPill } from '#/shared/data/home';
import { useProducts } from '#/features/order/useProducts';
import type { Product } from '#/shared/types';

import { ProductCard } from '#/widgets/ProductCard';
import styles from './ProductSection.module.css';

const FILTER_ICONS: Record<FilterPill, ComponentType<{ className?: string }>> = {
  'Донат': FilterDonatIcon,
  'Подписки': FilterSubsIcon,
  'Предметы': FilterItemsIcon,
  'Аккаунты': FilterAccountsIcon,
  'Ключи': FilterKeysIcon,
  'Игровая валюта': FilterCurrencyIcon,
  'Другое': FilterOtherIcon,
};

/** Демо-витрина: разное число карточек + пустые фильтры. */
const FILTER_COUNT: Record<FilterPill, number> = {
  'Донат': 5,
  'Подписки': 3,
  'Предметы': 2,
  'Аккаунты': 0,
  'Ключи': 4,
  'Игровая валюта': 1,
  'Другое': 0,
};

function filterDemoProducts(products: Product[], filter: FilterPill): Product[] {
  const count = FILTER_COUNT[filter];
  if (count <= 0 || products.length === 0) {
    return [];
  }

  const start = FILTER_PILLS.indexOf(filter) % products.length;
  const rotated = [...products.slice(start), ...products.slice(0, start)];
  return rotated.slice(0, Math.min(count, rotated.length));
}

function purchasableSkuSet(products: Product[]): Set<string> {
  const keys = products.filter((p) => p.type === 'key').map((p) => p.sku);
  const extras = products.filter((p) => p.type !== 'key').slice(0, 3).map((p) => p.sku);
  return new Set([...keys, ...extras]);
}

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
  const { products, loading, error } = useProducts(12);
  const [activeFilter, setActiveFilter] = useState<FilterPill>('Донат');
  const source = productsOverride ?? products;
  const buyable = purchasableSkuSet(source);
  const rows = showFilters
    ? filterDemoProducts(source, activeFilter)
    : source.slice(sliceStart, sliceEnd);
  const isPopular = title === 'Популярные товары';

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          {showFilters ? (
            <div className={styles.filters}>
              {FILTER_PILLS.map((pill) => {
                const Icon = FILTER_ICONS[pill];
                const active = pill === activeFilter;
                return (
                  <button
                    key={pill}
                    type="button"
                    className={`${styles.filter} ${active ? styles.filterActive : ''}`}
                    onClick={() => setActiveFilter(pill)}
                  >
                    <Icon className={styles.filterIcon} />
                    <span>{pill}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {showAllLink ? <a href="#" className="sectionLink">Показать все</a> : null}
        </div>

        {loading ? <p className={styles.message}>Загрузка…</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && rows.length === 0 ? (
          <div className={styles.empty} role="status">
            <p className={styles.emptyTitle}>Позиций нет</p>
            <p className={styles.emptyText}>
              По фильтру «{activeFilter}» ничего не нашлось.
            </p>
          </div>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <div className={styles.grid} key={activeFilter}>
            {rows.map((product, index) => (
              <ProductCard
                key={`${title}-${activeFilter}-${product.sku}-${index}`}
                product={product}
                index={index}
                purchasable={isPopular && buyable.has(product.sku)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
