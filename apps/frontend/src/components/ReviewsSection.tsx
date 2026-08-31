import { REVIEWS, formatPrice } from '@/data/home';

import styles from './ReviewsSection.module.css';

export function ReviewsSection() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2 className={styles.title}>Последние отзывы</h2>
          <a href="#" className="sectionLink">Показать все</a>
        </div>

        <div className={styles.grid}>
          {REVIEWS.map((review) => (
            <article key={review.id} className={styles.card}>
              <div className={styles.userRow}>
                <div className={styles.avatar}>{review.author.slice(0, 1)}</div>
                <div>
                  <p className={styles.author}>{review.author}</p>
                  <p className={styles.meta}>
                    <span className={styles.stars}>★★★★★</span>
                    {review.rating.toFixed(1)} · {review.date}
                  </p>
                </div>
              </div>
              <p className={styles.text}>{review.text}</p>
              <div className={styles.productRow}>
                <span className={styles.productName}>{review.product}</span>
                <span className={styles.productPrice}>{formatPrice(review.price, 'RUB')}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
