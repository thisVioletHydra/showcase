import { Header } from '#/widgets/Header';
import { HeroCarousel } from '#/widgets/HeroCarousel';
import { ProductSection } from '#/widgets/ProductSection';
import { ReviewsSection } from '#/widgets/ReviewsSection';
import { ServicesSteamCard } from '#/widgets/ServicesSteamCard';
import { SiteFooter } from '#/widgets/SiteFooter';

export function HomePage() {
  return (
    <div className="page">
      <div className="pageContent">
        <Header />
        <main>
          <HeroCarousel />
          <ServicesSteamCard />
          <ProductSection title="Популярные товары" showFilters sliceStart={0} sliceEnd={5} />
          <ProductSection title="Рекомендованные товары" showAllLink sliceStart={0} sliceEnd={5} />
          <ProductSection title="Другие товары" showAllLink sliceStart={5} sliceEnd={10} />
          <ReviewsSection />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
