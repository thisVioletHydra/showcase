export type ProductType = 'topup' | 'key' | 'subscription' | 'giftcard';

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'delivering'
  | 'delivered'
  | 'payment_failed'
  | 'out_of_stock'
  | 'delivery_failed';

export interface Product {
  sku: string;
  name: string;
  type: ProductType;
  price: number;
  currency: string;
  image: string;
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
}

export interface CreateOrderResponse {
  order_id: string;
  status: OrderStatus;
  amount: number;
  currency: string;
  promocode: string | null;
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
  accent: string;
  image?: string;
}

export interface ServiceItem {
  id: string;
  label: string;
  icon: string;
}

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  product: string;
  price: number;
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
