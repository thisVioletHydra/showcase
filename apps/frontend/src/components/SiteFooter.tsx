import styles from './SiteFooter.module.css';

const NAV_LINKS = ['Стать продавцом', 'Бонусы', 'Поддержка', 'Гарантии', 'Отзывы'];
const LEGAL_LINKS = ['Политика конфиденциальности', 'Соглашение', 'Договор оферта'];

export function SiteFooter() {
  return (
    <footer className={styles.section}>
      <div className="container">
        <div className={styles.card}>
          <div className={styles.topRow}>
            <nav className={styles.nav}>
              {NAV_LINKS.map((link) => (
                <a key={link} href="#" className={styles.navLink}>{link}</a>
              ))}
            </nav>
            <div className={styles.socials}>
              <span className={styles.socialBadge}>VK</span>
              <span className={styles.socialBadge}>TG</span>
              <span className={styles.socialBadge}>TT</span>
              <span className={styles.socialBadge}>YT</span>
            </div>
            <div className={styles.payments}>
              <span className={styles.payBadge}>VISA</span>
              <span className={styles.payBadge}>MIR</span>
              <span className={styles.payBadge}>MC</span>
            </div>
          </div>

          <div className={styles.bottomRow}>
            <span className={styles.copy}>© GGSEL Showcase, 2026</span>
            <nav className={styles.legal}>
              {LEGAL_LINKS.map((link) => (
                <a key={link} href="#" className={styles.legalLink}>{link}</a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
