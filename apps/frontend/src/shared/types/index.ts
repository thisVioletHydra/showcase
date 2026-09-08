export type ProductType = 'topup' | 'key' | 'subscription' | 'giftcard';

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'payment_failed'
  | 'out_of_stock'
  | 'delivery_failed'
  | 'expired';

export interface Product {
  sku: string;
  name: string;
  type: ProductType;
  price: number;
  currency: string;
  image: string;
  available: number;
}

export interface Order {
  id: string;
  sku: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  key_code: string | null;
  promocode: string | null;
  created_at: string;
  updated_at: string;
  held_until: string | null;
}

export interface CreateOrderResponse {
  order_id: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  promocode: string | null;
  held_until: string | null;
}

export interface SoldOutPayload {
  code: 'sold_out';
  error: string;
  neighbor: Product | null;
}

export interface CatalogSnapshot {
  at: string;
  products: Product[];
}

export type CurrencyCode = 'USD' | 'KZT' | 'RUB';

export interface CatalogCategory {
  id: string;
  label: string;
  items: string[];
}

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  /** object-fit override; default cover */
  imageFit?: 'cover' | 'contain';
}

export interface ServiceItem {
  id: string;
  label: string;
  initials?: string;
  fill?: string;
  accent?: string;
  tone?: 'light' | 'dark';
  icon?: string;
  iconStub?: boolean;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  product: string;
  price: number;
  avatar: string;
  productImage: string;
}

export type CatalogLink = string | string[];

export interface CatalogSidebarItem {
  id: string;
  label: string;
  ready?: boolean;
}

export interface CatalogColumn {
  title: string;
  links: CatalogLink[];
}
