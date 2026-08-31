import type { CarouselSlide, CatalogColumn, CatalogLink, ReviewItem, ServiceItem } from '@/types';

export const HERO_SLIDES: CarouselSlide[] = [
  {
    id: 'slide-1',
    title: 'PUBG Mobile UC',
    subtitle: 'Моментальная доставка',
    accent: '#111111',
    image: '/assets/hero/slide-1.svg',
  },
  {
    id: 'slide-2',
    title: 'Пополнение Steam',
    subtitle: 'Без комиссии на первый заказ',
    accent: '#1b2838',
    image: '/assets/hero/slide-2.svg',
  },
  {
    id: 'slide-3',
    title: 'Подписки и ключи',
    subtitle: 'Discord, Spotify, CS2 Prime',
    accent: '#312e81',
    image: '/assets/hero/slide-3.svg',
  },
];

export const SERVICE_ITEMS: ServiceItem[] = [
  { id: 'steam', label: 'Steam', icon: '/assets/steam.svg' },
  { id: 'telegram', label: 'Telegram', icon: '/assets/services/telegram.svg' },
  { id: 'roblox', label: 'Roblox', icon: '/assets/roblox.svg' },
  { id: 'brawl', label: 'Brawl Stars', icon: '/assets/services/brawl.svg' },
  { id: 'pubg', label: 'PUBG Mobile', icon: '/assets/services/pubg.svg' },
  { id: 'appstore', label: 'App Store', icon: '/assets/services/appstore.svg' },
  { id: 'chatgpt', label: 'ChatGPT', icon: '/assets/services/chatgpt.svg' },
  { id: 'ps', label: 'PlayStation', icon: '/assets/psn.svg' },
  { id: 'tiktok', label: 'TikTok', icon: '/assets/services/tiktok.svg' },
  { id: 'ml', label: 'Mobile Legends', icon: '/assets/services/ml.svg' },
  { id: 'more', label: '+ ещё 841', icon: '' },
];

export const FILTER_PILLS = [
  'Донат',
  'Подписки',
  'Предметы',
  'Аккаунты',
  'Ключи',
  'Игровая валюта',
  'Другое',
];

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

export const REVIEWS: ReviewItem[] = [
  {
    id: 'r1',
    author: 'Bizidin',
    rating: 5,
    date: 'Сегодня, 12:45',
    text: 'Всё пришло быстро, ключ активировался без проблем. Рекомендую!',
    product: 'FunTime | Полностью готовый сервер...',
    price: 135,
  },
  {
    id: 'r2',
    author: 'AlexGamer',
    rating: 5,
    date: 'Вчера, 21:10',
    text: 'Пополнение Steam за пару минут. Удобно и без лишней возни.',
    product: 'Пополнение Steam 1000 ₽',
    price: 1000,
  },
  {
    id: 'r3',
    author: 'Mira_K',
    rating: 4.8,
    date: '2 дня назад',
    text: 'Брал CS2 Prime — всё ок, поддержка ответила быстро.',
    product: 'CS2 Prime Status ключ',
    price: 1290,
  },
];

export const PRODUCT_COVERS = [
  '/assets/products/cover-1.svg',
  '/assets/products/cover-2.svg',
  '/assets/products/cover-3.svg',
  '/assets/products/cover-4.svg',
  '/assets/products/cover-5.svg',
];

export function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

export function resolveProductImage(imagePath: string, index = 0): string {
  if (imagePath.includes('products/cover')) {
    return imagePath;
  }
  return PRODUCT_COVERS[index % PRODUCT_COVERS.length] ?? '/assets/products/cover-1.svg';
}

export function strikePrice(price: number): number {
  return Math.round(price * 2.01);
}
