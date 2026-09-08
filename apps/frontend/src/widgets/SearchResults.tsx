import { useSearchParams } from 'react-router-dom';

import { useCatalogSearch } from '#/features/search/useCatalogSearch';
import { SEARCH_TYPE_CHIPS, parseSearchType } from '#/features/search/params';
import { ProductCard } from '#/widgets/ProductCard';

import styles from './SearchResults.module.css';

interface SearchResultsProps {
  q: string;
  type: string;
}

export function SearchResults({ q, type }: SearchResultsProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, total, loading, error } = useCatalogSearch(q, type, 50);
  const needle = q.trim();
  const title = needle ? `Результаты: «${needle}»` : 'Каталог';

  const setType = (next: string) => {
    const params = new URLSearchParams(searchParams);
    if (next) {
      params.set('type', next);
    } else {
      params.delete('type');
    }
    setSearchParams(params, { replace: true });
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>{title}</h2>
            <p className={styles.meta}>
              {loading ? 'Ищем…' : `Найдено ${total}`}
            </p>
          </div>
          <div className={styles.filters} role="group" aria-label="Тип товара">
            {SEARCH_TYPE_CHIPS.map((chip) => {
              const active = parseSearchType(type) === chip.id;
              return (
                <button
                  key={chip.id || 'all'}
                  type="button"
                  className={`${styles.filter} ${active ? styles.filterActive : ''}`}
                  aria-pressed={active}
                  onClick={() => setType(chip.id)}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error && products.length === 0 ? (
          <div className={styles.empty} role="status">
            <p className={styles.emptyTitle}>Ничего не нашлось</p>
            <p className={styles.emptyText}>
              Попробуй другой запрос или сними фильтр по типу.
            </p>
          </div>
        ) : null}

        {products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.sku}
                product={product}
                purchasable
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
