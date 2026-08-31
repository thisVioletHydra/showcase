import { useState } from 'react';

import { CATALOG_COLLECTIONS, CATALOG_COLUMNS, CATALOG_SIDEBAR } from '@/data/home';
import type { CatalogLink } from '@/types';

import { ChevronRightIcon } from '@/components/icons/MegaMenuIcons';

import styles from './CatalogMegaMenu.module.css';

interface CatalogMegaMenuProps {
  onClose: () => void;
}

const DEFAULT_CATEGORY_ID = 'games';

function linkKey(link: CatalogLink): string {
  return Array.isArray(link) ? link.join('-') : link;
}

function CatalogLinkItem({
  link,
  onClose,
}: {
  link: CatalogLink;
  onClose: () => void;
}) {
  if (Array.isArray(link)) {
    return (
      <a href="#" className={styles.linkMultiline} onClick={onClose}>
        {link.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </a>
    );
  }

  return (
    <a href="#" className={styles.link} onClick={onClose}>{link}</a>
  );
}

function CatalogGamesContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className={styles.platforms}>
        {CATALOG_COLUMNS.map((column) => (
          <div key={column.title} className={styles.column}>
            <button type="button" className={styles.columnTitle} onClick={onClose}>
              {column.title}
              <ChevronRightIcon className={styles.chevron} />
            </button>
            <ul className={styles.linkList}>
              {column.links.map((link) => (
                <li key={linkKey(link)}>
                  <CatalogLinkItem link={link} onClose={onClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.collections}>
        <button type="button" className={styles.columnTitle} onClick={onClose}>
          Подборки
          <ChevronRightIcon className={styles.chevron} />
        </button>
        <ul className={styles.linkList}>
          {CATALOG_COLLECTIONS.map((item) => (
            <li key={linkKey(item)}>
              <CatalogLinkItem link={item} onClose={onClose} />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function CatalogStub() {
  return (
    <div className={styles.stub}>
      <img
        className={styles.stubCat}
        src="/assets/catalog-stub-cat.svg"
        alt=""
      />
    </div>
  );
}

export function CatalogMegaMenu({ onClose }: CatalogMegaMenuProps) {
  const [activeId, setActiveId] = useState(DEFAULT_CATEGORY_ID);
  const activeItem = CATALOG_SIDEBAR.find((item) => item.id === activeId) ?? CATALOG_SIDEBAR[0];

  return (
    <div className={styles.panel}>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarList}>
            {CATALOG_SIDEBAR.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.sidebarItem} ${item.id === activeId ? styles.sidebarItemActive : ''}`}
                onMouseEnter={() => setActiveId(item.id)}
                onFocus={() => setActiveId(item.id)}
              >
                <span>{item.label}</span>
                <ChevronRightIcon className={styles.chevron} />
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.main}>
          {activeItem.ready
            ? <CatalogGamesContent onClose={onClose} />
            : <CatalogStub />}
        </div>
      </div>
    </div>
  );
}
