import type { CarouselSlide, CatalogColumn, CatalogLink, ReviewItem, ServiceItem } from '#/shared/types';
import { assetUrl } from '#/shared/lib/assetUrl';

export const HERO_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-1',
    title: 'EW, PEOPLE',
    subtitle: '',
    image: assetUrl('assets/webp/hero/slide-cats.webp'),
    imageFit: 'contain',
  },
  {
    id: 'slide-2',
    title: 'Пополнение Steam',
    subtitle: 'Без комиссии на первый заказ',
    image: assetUrl('assets/webp/hero/slide-steam.webp'),
  },
  {
    id: 'slide-3',
    title: 'Подписки и ключи',
    subtitle: 'Discord, Spotify, CS2 Prime',
    image: assetUrl('assets/webp/hero/slide-keys.webp'),
  },
  {
    id: 'slide-4',
    title: 'PUBG Mobile UC',
    subtitle: 'Моментальная доставка',
    image: assetUrl('assets/webp/hero/slide-pubg.webp'),
  },
  {
    id: 'slide-5',
    title: 'CS2 Prime',
    subtitle: 'Ключи и подписки',
    image: assetUrl('assets/webp/hero/slide-cs2.webp'),
  },
  {
    id: 'slide-6',
    title: 'Discord Nitro',
    subtitle: 'Подарочные коды',
    image: assetUrl('assets/webp/hero/slide-discord.webp'),
  },
];

/** Ряд как в макете: 11 слотов, без скролла. Последний — «еще». */
export const SERVICE_ITEMS: ServiceItem[] = [
  { id: 'steam', label: 'Steam', icon: assetUrl('assets/webp/services/steam.webp') },
  { id: 'telegram', label: 'Telegram', icon: assetUrl('assets/webp/services/telegram.webp') },
  { id: 'roblox', label: 'Roblox', icon: assetUrl('assets/webp/services/roblox.webp') },
  { id: 'brawl', label: 'Brawl Stars', icon: assetUrl('assets/webp/services/brawl.webp') },
  { id: 'pubg', label: 'PUBG Mobile', icon: assetUrl('assets/webp/services/pubg.webp') },
  { id: 'appstore', label: 'App Store', icon: assetUrl('assets/webp/services/appstore.webp') },
  { id: 'chatgpt', label: 'ChatGPT', icon: assetUrl('assets/webp/services/chatgpt.webp') },
  { id: 'ps', label: 'PlayStation', icon: assetUrl('assets/webp/services/playstation.webp') },
  { id: 'tiktok', label: 'TikTok', icon: assetUrl('assets/webp/services/tiktok.webp') },
  { id: 'ml', label: 'Mobile Legends', icon: assetUrl('assets/webp/services/mobile-legends.webp') },
  { id: 'more', label: 'еще 841', icon: assetUrl('assets/svg/more-games.svg'), iconStub: true },
];

export const FILTER_PILLS = [
  'Донат',
  'Подписки',
  'Предметы',
  'Аккаунты',
  'Ключи',
  'Игровая валюта',
  'Другое',
] as const;

export type FilterPill = (typeof FILTER_PILLS)[number];

export const CATALOG_SIDEBAR = [
  { id: 'games', label: 'Игры и игровые сервисы', ready: true },
  { id: 'values', label: 'Игровые ценности' },
  { id: 'mobile', label: 'Мобильные игры' },
  { id: 'social', label: 'Сервисы и соцсети' },
  { id: 'software', label: 'Программы' },
];

export const CATALOG_COLUMNS: CatalogColumn[] = [
  {
    title: 'Steam',
    links: [
      'Игры и DLC',
      'Пополнение баланса',
      'Подарочные карты',
      ['Коллекционные', 'карточки'],
      'Смена региона',
    ],
  },
  {
    title: 'PlayStation',
    links: ['Игры и DLC', 'Пополнение баланса', 'Новые аккаунты', 'PS Plus', 'EA Play'],
  },
  {
    title: 'Xbox',
    links: ['Игры и DLC', 'Пополнение баланса', 'Новые аккаунты', 'Xbox Game Pass', 'Услуги'],
  },
  {
    title: 'Nintendo',
    links: ['Игры и DLC', 'Подарочные карты', 'Новые аккаунты', 'NS Online'],
  },
  {
    title: 'Battle.net',
    links: ['World of Warcraft', 'Подарочные карты', 'Прямое пополнение', 'Новые аккаунты', 'Смена региона'],
  },
];

export const CATALOG_COLLECTIONS: CatalogLink[] = [
  'Скидки 90%',
  ['Популярные', 'издатели'],
  'Лучшие серии игр',
  'Steam Deck',
  'Bundle-наборы',
];

const REVIEW_TEXT =
  'Отзывчивый и приятный продавец, помог не только с товаром но и с другим вопросом. Рекомендую!';
const REVIEW_PRODUCT = '🌸 FunTime | Полностью готовый сервер под ключ ⚡';

export const REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    author: 'Bizidin',
    rating: 5,
    date: 'Сегодня в 11:48',
    text: REVIEW_TEXT,
    product: REVIEW_PRODUCT,
    price: 139,
    avatar: assetUrl('assets/webp/reviews/avatar.webp'),
    productImage: assetUrl('assets/webp/reviews/product.webp'),
  },
  {
    id: 'r2',
    author: 'Bizidin',
    rating: 5,
    date: 'Сегодня в 11:48',
    text: REVIEW_TEXT,
    product: REVIEW_PRODUCT,
    price: 139,
    avatar: assetUrl('assets/webp/reviews/avatar.webp'),
    productImage: assetUrl('assets/webp/reviews/product.webp'),
  },
  {
    id: 'r3',
    author: 'Bizidin',
    rating: 5,
    date: 'Сегодня в 11:48',
    text: REVIEW_TEXT,
    product: REVIEW_PRODUCT,
    price: 139,
    avatar: assetUrl('assets/webp/reviews/avatar.webp'),
    productImage: assetUrl('assets/webp/reviews/product.webp'),
  },
];

export const PRODUCT_COVERS = [
  assetUrl('assets/webp/products/cover-1.webp'),
  assetUrl('assets/webp/products/cover-2.webp'),
  assetUrl('assets/webp/products/cover-3.webp'),
  assetUrl('assets/webp/products/cover-4.webp'),
  assetUrl('assets/webp/products/cover-5.webp'),
];

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

/** Убирает хвост цены из названия каталога («… 1500 ₽»). */
export function displayProductName(name: string): string {
  return name.replace(/\s+[\d\s\u00a0]+₽\s*$/u, '').trim() || name;
}

/** Стабильный индекс обложки по sku — один и тот же на витрине и на /order. */
export function productCoverIndex(sku: string): number {
  let hash = 0;
  for (let i = 0; i < sku.length; i += 1) {
    hash = (hash + sku.charCodeAt(i) * (i + 1)) % 997;
  }

  return hash % PRODUCT_COVERS.length;
}

export function resolveProductImage(_imagePath: string, indexOrSku: number | string = 0): string {
  const index = typeof indexOrSku === 'string'
    ? productCoverIndex(indexOrSku)
    : indexOrSku;

  return PRODUCT_COVERS[index % PRODUCT_COVERS.length] ?? PRODUCT_COVERS[0];
}

export function strikePrice(price: number): number {
  return Math.round(price * 2.01);
}
