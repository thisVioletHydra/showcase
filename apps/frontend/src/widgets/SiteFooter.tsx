import { assetUrl } from '#/shared/lib/assetUrl';

import styles from './SiteFooter.module.css';

const NAV_LINKS = ['Стать продавцом', 'Бонусы', 'Поддержка', 'Гарантии', 'Отзывы'];
const LEGAL_LINKS = ['Политика конфиденциальности', 'Соглашение', 'Договор-оферта'];

const SOCIALS = [
  { label: 'VK', src: assetUrl('assets/svg/social-vk.svg'), w: 18, h: 11 },
  { label: 'Telegram', src: assetUrl('assets/svg/social-telegram.svg'), w: 18, h: 16 },
  { label: 'TikTok', src: assetUrl('assets/svg/social-tiktok.svg'), w: 14, h: 17 },
  { label: 'YouTube', src: assetUrl('assets/svg/social-youtube.svg'), w: 18, h: 14 },
] as const;

const PAYMENTS = [
  { label: 'Visa', src: assetUrl('assets/svg/pay-visa.svg'), w: 61, h: 28 },
  { label: 'Мир', src: assetUrl('assets/svg/pay-mir.svg'), w: 55, h: 28 },
  { label: 'Mastercard', src: assetUrl('assets/svg/pay-mastercard.svg'), w: 54, h: 28 },
] as const;

export function SiteFooter() {
  return (
    <footer className={styles.section}>
      <div className="container">
        <div className={styles.card}>
          <nav className={styles.nav}>
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className={styles.navLink}>{link}</a>
            ))}
          </nav>

          <div className={styles.midRow}>
            <div className={styles.socials}>
              {SOCIALS.map((s) => (
                <a key={s.label} href="#" className={styles.socialBadge} aria-label={s.label}>
                  <img src={s.src} alt="" width={s.w} height={s.h} />
                </a>
              ))}
            </div>

            <div className={styles.payments}>
              {PAYMENTS.map((p) => (
                <img
                  key={p.label}
                  className={styles.payImg}
                  src={p.src}
                  alt={p.label}
                  width={p.w}
                  height={p.h}
                />
              ))}
            </div>
          </div>

          <div className={styles.bottomRow}>
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
