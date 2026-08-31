import { Link } from 'react-router-dom';

import { CatalogMegaMenu } from '@/components/CatalogMegaMenu';
import {
  CatalogGridIcon,
  HeartIcon,
  ProfileIcon,
  SearchIcon,
} from '@/components/icons/MegaMenuIcons';
import { useCatalog } from '@/hooks/useCatalog';

import styles from './Header.module.css';

export function Header() {
  const catalog = useCatalog();

  return (
    <header className={styles.header} ref={catalog.rootRef}>
      <div className={`container ${styles.inner}`}>
        <Link to="/" className={styles.logo}>GGSEL</Link>

        <button
          type="button"
          className={`${styles.catalogBtn} ${catalog.open ? styles.catalogBtnActive : ''}`}
          onClick={catalog.toggle}
        >
          <CatalogGridIcon />
          <span>Каталог</span>
        </button>

        <div className={styles.searchWrap}>
          <div className={styles.searchField}>
            <input
              className={styles.searchInput}
              type="search"
              placeholder="Игра, приложение или услуга..."
            />
            <button type="button" className={styles.heartBtn} aria-label="Избранное">
              <HeartIcon />
            </button>
          </div>
          <button type="button" className={styles.searchBtn} aria-label="Поиск">
            <SearchIcon />
          </button>
        </div>

        <button type="button" className={styles.profileBtn} aria-label="Профиль">
          <ProfileIcon />
        </button>
      </div>

      {catalog.open ? <CatalogMegaMenu onClose={catalog.close} /> : null}
    </header>
  );
}
