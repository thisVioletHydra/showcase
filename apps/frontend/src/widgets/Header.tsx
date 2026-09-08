import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { CatalogMegaMenu } from '#/widgets/CatalogMegaMenu';
import { useCatalog } from '#/features/catalog/useCatalog';
import { useCatalogSearch } from '#/features/search/useCatalogSearch';
import { parseSearchType, readSearchQuery, withPreservedDebug } from '#/features/search/params';
import { formatPrice, resolveProductImage } from '#/shared/data/home';
import { withDebugQuery } from '#/shared/lib/debugQuery';
import {
  CatalogGridIcon,
  HeartIcon,
  ProfileIcon,
  SearchIcon,
} from '#/shared/ui/icons/MegaMenuIcons';

import styles from './Header.module.css';

const SEARCH_DEBOUNCE_MS = 200;

export function Header() {
  const catalog = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const searchRef = useRef<HTMLDivElement>(null);
  const urlQ = readSearchQuery(params);
  const [query, setQuery] = useState(urlQ);
  const [open, setOpen] = useState(false);

  const showDropdown = open && query.trim().length > 0;
  const preview = useCatalogSearch(showDropdown ? query : '', '', 8);

  useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  const commitQuery = (raw: string, replace: boolean) => {
    const trimmed = raw.trim();
    const next = withPreservedDebug(params);
    if (location.pathname === '/') {
      const type = parseSearchType(params.get('type'));
      if (type) {
        next.set('type', type);
      }
    }
    if (trimmed) {
      next.set('q', trimmed);
    }

    const search = next.toString();
    navigate({
      pathname: '/',
      search: search ? `?${search}` : '',
    }, { replace });
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed === urlQ.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      commitQuery(query, true);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query, urlQ]);

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

  const pickProduct = (name: string) => {
    setQuery(name);
    setOpen(false);
    commitQuery(name, true);
  };

  return (
    <header className={styles.header} ref={catalog.rootRef}>
      <div className={`container ${styles.inner}`}>
        <Link to={withDebugQuery('/')} className={styles.logo}>GGSEL</Link>

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
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    setOpen(false);
                    commitQuery(query, false);
                  }
                }}
              />
              <button type="button" className={styles.heartBtn} aria-label="Избранное">
                <HeartIcon />
              </button>
            </div>
            <button
              type="button"
              className={styles.searchBtn}
              aria-label="Поиск"
              onClick={() => {
                setOpen(false);
                commitQuery(query, false);
              }}
            >
              <SearchIcon />
            </button>

            {showDropdown ? (
              <div className={styles.searchDropdown} role="listbox">
                {preview.loading && preview.products.length === 0 ? (
                  <p className={styles.searchEmpty}>Ищем…</p>
                ) : preview.products.length === 0 ? (
                  <p className={styles.searchEmpty}>Ничего не найдено</p>
                ) : (
                  <ul className={styles.searchList}>
                    {preview.products.map((product) => (
                      <li key={product.sku}>
                        <button
                          type="button"
                          className={styles.searchItem}
                          role="option"
                          onClick={() => pickProduct(product.name)}
                        >
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
                        </button>
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
