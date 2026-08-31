import { REVIEWS } from '#/shared/data/home';
import { assetUrl } from '#/shared/lib/assetUrl';

import styles from './ReviewsSection.module.css';

export function ReviewsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <div className={styles.headText}>
            <h2 className={styles.title}>Последние отзывы</h2>
            <p className={styles.subtitle}>Все отзывы взяты с независимой площадки</p>
          </div>
          <a href="#" className={styles.showAll}>Показать все</a>
        </div>

        <div className={styles.grid}>
          {REVIEWS.map((review) => (
            <article key={review.id} className={styles.card}>
              <div className={styles.userRow}>
                <div className={styles.userLeft}>
                  <img
                    className={styles.avatar}
                    src={review.avatar}
                    alt=""
                    width={48}
                    height={48}
                  />
                  <div className={styles.userMeta}>
                    <p className={styles.author}>{review.author}</p>
                    <div className={styles.ratingRow}>
                      <img
                        className={styles.stars}
                        src={assetUrl('assets/svg/stars.svg')}
                        alt=""
                        width={76}
                        height={16}
                        aria-hidden
                      />
                      <span className={styles.rating}>{review.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <time className={styles.date}>{review.date}</time>
              </div>

              <div className={styles.textBox}>
                <p className={styles.text}>{review.text}</p>
              </div>

              <a href="#" className={styles.productRow}>
                <img
                  className={styles.productThumb}
                  src={review.productImage}
                  alt=""
                  width={64}
                  height={52}
                />
                <span className={styles.productName}>{review.product}</span>
                <span className={styles.pricePill}>{review.price}₽</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
