import type { OrderItem } from '../types';

export function calculateSubtotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.totalPrice, 0);
}

export function calculateTotal(subtotal: number, deliveryCharge: number, discount: number): number {
  return subtotal + deliveryCharge - discount;
}

export function calculateItemTotal(quantity: number, unitPrice: number): number {
  return quantity * unitPrice;
}

export function calculateProfit(sellPrice: number, buyPrice: number, quantity: number): number {
  return (sellPrice - buyPrice) * quantity;
}

export function calculateDueAmount(totalAmount: number, paidAmount: number): number {
  return Math.max(0, totalAmount - paidAmount);
}
