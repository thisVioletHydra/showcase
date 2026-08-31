import { CarouselArrowIcon, CarouselArrowSprite } from '#/shared/ui/icons/CarouselArrowIcon';
import { HERO_SLIDES } from '#/shared/data/home';
import { useCarousel } from '#/features/carousel/useCarousel';

import styles from './HeroCarousel.module.css';

export function HeroCarousel() {
  const { index, goNext, goPrev, goTo } = useCarousel(HERO_SLIDES.length);

  return (
    <section className={styles.section}>
      <CarouselArrowSprite className={styles.sprite} />

      <div className="container">
        <div className={styles.carousel}>
          <div className={styles.stage}>
            {HERO_SLIDES.map((slide, slideIndex) => (
              <div
                key={slide.id}
                className={`${styles.slide} ${slideIndex === index ? styles.slideActive : ''}`}
              >
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt=""
                    className={`${styles.slideImage} ${slide.imageFit === 'contain' ? styles.slideImageContain : ''}`}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className={styles.controlsShell}>
            <div className={styles.cornerTl} aria-hidden="true" />
            <div className={styles.cornerBr} aria-hidden="true" />

            <div className={styles.controls}>
              <button
                type="button"
                className={`${styles.controlBtn} ${styles.controlBtnPrev}`}
                onClick={goPrev}
                aria-label="Previous slide"
              >
                <CarouselArrowIcon mirroredClassName={styles.arrowMirrored} />
              </button>
              <button
                type="button"
                className={`${styles.controlBtn} ${styles.controlBtnNext}`}
                onClick={goNext}
                aria-label="Next slide"
              >
                <CarouselArrowIcon mirrored mirroredClassName={styles.arrowMirrored} />
              </button>
            </div>
          </div>

          <div className={styles.dotsShell}>
            <div className={styles.dots}>
              {HERO_SLIDES.map((slide, dotIndex) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ''}`}
                  onClick={() => goTo(dotIndex)}
                  aria-label={`Slide ${dotIndex + 1}`}
                  aria-current={dotIndex === index ? 'true' : undefined}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
