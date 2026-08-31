import type { OrderStatus } from '#/shared/types';

export type StatusTone = 'pending' | 'progress' | 'success' | 'danger';
export type StatusMood = 'wait' | 'progress' | 'success' | 'broken';

export interface OrderStatusMeta {
  tone: StatusTone;
  mood: StatusMood;
  label: string;
  title: string;
  hint: string;
}

const META: Record<OrderStatus, OrderStatusMeta> = {
  created: {
    tone: 'pending',
    mood: 'wait',
    label: 'К оплате',
    title: 'Ожидает оплаты',
    hint: 'Можно применить промокод, затем оплатить',
  },
  paid: {
    tone: 'progress',
    mood: 'progress',
    label: 'Оплачен',
    title: 'В процессе…',
    hint: 'Ждём поставщика — ключ появится здесь',
  },
  delivering: {
    tone: 'progress',
    mood: 'progress',
    label: 'Выдача',
    title: 'В процессе…',
    hint: 'Обычно занимает несколько секунд',
  },
  delivered: {
    tone: 'success',
    mood: 'success',
    label: 'Выдан',
    title: 'Готово',
    hint: 'Сохрани ключ — повторно он не придёт',
  },
  payment_failed: {
    tone: 'danger',
    mood: 'broken',
    label: 'Отказ',
    title: 'Оплата не прошла',
    hint: 'Создай новый заказ — этот уже закрыт',
  },
  out_of_stock: {
    tone: 'danger',
    mood: 'broken',
    label: 'Нет ключей',
    title: 'Не выдали',
    hint: 'Админ пополнит пул и повторит выдачу',
  },
  delivery_failed: {
    tone: 'danger',
    mood: 'broken',
    label: 'Сбой',
    title: 'Не выдали',
    hint: 'Админ может повторить выдачу',
  },
};

export function getOrderStatusMeta(status: OrderStatus): OrderStatusMeta {
  return META[status];
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return (
    status === 'delivered'
    || status === 'payment_failed'
    || status === 'out_of_stock'
    || status === 'delivery_failed'
  );
}
