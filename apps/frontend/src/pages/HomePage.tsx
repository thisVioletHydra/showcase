import { Header } from '@/components/Header';
import { HeroCarousel } from '@/components/HeroCarousel';
import { ProductSection } from '@/components/ProductSection';
import { ReviewsSection } from '@/components/ReviewsSection';
import { ServicesSteamCard } from '@/components/ServicesSteamCard';
import { SiteFooter } from '@/components/SiteFooter';

export function HomePage() {
  return (
    <div className="page">
      <div className="pageContent">
        <Header />
        <main>
          <HeroCarousel />
          <ServicesSteamCard />
          <ProductSection title="Популярные товары" showFilters sliceStart={0} sliceEnd={5} />
          <ReviewsSection />
          <ProductSection title="Рекомендованные товары" showAllLink sliceStart={0} sliceEnd={5} />
          <ProductSection title="Другие товары" showAllLink sliceStart={5} sliceEnd={10} />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
