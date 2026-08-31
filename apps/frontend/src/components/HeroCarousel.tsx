import { HERO_SLIDES } from '@/data/home';
import { useCarousel } from '@/hooks/useCarousel';

import styles from './HeroCarousel.module.css';

export function HeroCarousel() {
  const { index, goNext, goPrev, goTo } = useCarousel(HERO_SLIDES.length);

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.carousel}>
          {HERO_SLIDES.map((slide, slideIndex) => (
            <div
              key={slide.id}
              className={`${styles.slide} ${slideIndex === index ? styles.slideActive : ''}`}
              style={{ background: slide.accent }}
            >
              {slide.image ? (
                <img src={slide.image} alt="" className={styles.slideImage} />
              ) : null}
            </div>
          ))}

          <button type="button" className={`${styles.arrow} ${styles.arrowPrev}`} onClick={goPrev} aria-label="Previous">
            <img src="/assets/arrow-slider.png" alt="" width={12} height={12} />
          </button>
          <button type="button" className={`${styles.arrow} ${styles.arrowNext}`} onClick={goNext} aria-label="Next">
            <img src="/assets/arrow-slider.png" alt="" width={12} height={12} className={styles.arrowFlip} />
          </button>

          <div className={styles.dots}>
            {HERO_SLIDES.map((slide, dotIndex) => (
              <button
                key={slide.id}
                type="button"
                className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ''}`}
                onClick={() => goTo(dotIndex)}
                aria-label={`Slide ${dotIndex + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
