import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { CatalogMegaMenu } from '#/widgets/CatalogMegaMenu';
import { useCatalog } from '#/features/catalog/useCatalog';
import { useProducts } from '#/features/order/useProducts';
import { formatPrice, resolveProductImage } from '#/shared/data/home';
import type { Product } from '#/shared/types';
import {
  CatalogGridIcon,
  HeartIcon,
  ProfileIcon,
  SearchIcon,
} from '#/shared/ui/icons/MegaMenuIcons';

import styles from './Header.module.css';

function matchProduct(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return false;
  }

  return (
    product.name.toLowerCase().includes(q)
    || product.sku.toLowerCase().includes(q)
    || product.type.toLowerCase().includes(q)
  );
}

export function Header() {
  const catalog = useCatalog();
  const { products } = useProducts(0);
  const searchRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(
    () => products.filter((product) => matchProduct(product, query)).slice(0, 8),
    [products, query],
  );

  const showDropdown = open && query.trim().length > 0;

  useEffect(() => {
    if (!showDropdown) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showDropdown]);

  return (
    <header className={styles.header} ref={catalog.rootRef}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>GGSEL</Link>

        <div className={styles.toolbar}>
          <button
            type="button"
            className={`${styles.catalogBtn} ${catalog.open ? styles.catalogBtnActive : ''}`}
            onClick={catalog.toggle}
          >
            <CatalogGridIcon />
            <span>Каталог</span>
          </button>

          <div className={styles.searchWrap} ref={searchRef}>
            <div className={styles.searchField}>
              <input
                className={styles.searchInput}
                type="search"
                placeholder="Игра, приложение или услуга..."
                value={query}
                autoComplete="off"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
              />
              <button type="button" className={styles.heartBtn} aria-label="Избранное">
                <HeartIcon />
              </button>
            </div>
            <button type="button" className={styles.searchBtn} aria-label="Поиск">
              <SearchIcon />
            </button>

            {showDropdown ? (
              <div className={styles.searchDropdown} role="listbox">
                {results.length === 0 ? (
                  <p className={styles.searchEmpty}>Ничего не найдено</p>
                ) : (
                  <ul className={styles.searchList}>
                    {results.map((product, index) => (
                      <li key={product.sku} className={styles.searchItem} role="option">
                        <img
                          className={styles.searchThumb}
                          src={resolveProductImage(product.image, product.sku)}
                          alt=""
                        />
                        <span className={styles.searchItemBody}>
                          <span className={styles.searchItemName}>{product.name}</span>
                          <span className={styles.searchItemSku}>{product.sku}</span>
                        </span>
                        <span className={styles.searchItemPrice}>
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>

          <button type="button" className={styles.profileBtn} aria-label="Профиль">
            <ProfileIcon />
          </button>
        </div>
      </div>

      {catalog.open ? <CatalogMegaMenu onClose={catalog.close} /> : null}
    </header>
  );
}
