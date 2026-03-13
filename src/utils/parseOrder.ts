import { format } from 'date-fns';
import { db } from '../db/database';

export async function generateOrderNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `ORD-${today}-`;

  const todayOrders = await db.orders
    .where('orderNumber')
    .startsWith(prefix)
    .count();

  const num = String(todayOrders + 1).padStart(3, '0');
  return `${prefix}${num}`;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const intl = cleaned.startsWith('88') ? cleaned : `88${cleaned}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${intl}?text=${encoded}`;
}

export function getOrderConfirmationMessage(
  customerName: string,
  orderNumber: string,
  items: string,
  total: number,
  deliveryArea: string,
): string {
  return `অর্ডারঘর থেকে:\n\nপ্রিয় ${customerName},\nআপনার অর্ডার #${orderNumber} কনফার্ম হয়েছে।\n\nপণ্য: ${items}\nমোট: ৳${total}\nডেলিভারি: ${deliveryArea}\n\nধন্যবাদ!`;
}

export function getPaymentReminderMessage(
  customerName: string,
  dueAmount: number,
  orderNumber: string,
): string {
  return `অর্ডারঘর থেকে:\n\nপ্রিয় ${customerName},\nআপনার ৳${dueAmount} বাকি আছে (অর্ডার #${orderNumber})।\n\nধন্যবাদ!`;
}

export function getDeliveryUpdateMessage(
  customerName: string,
  orderNumber: string,
  deliveryProvider: string,
  trackingNumber: string,
): string {
  return `অর্ডারঘর থেকে:\n\nপ্রিয় ${customerName},\nআপনার অর্ডার #${orderNumber} শিপ করা হয়েছে!\n\nডেলিভারি: ${deliveryProvider}\nট্র্যাকিং: ${trackingNumber}\n\nশীঘ্রই পৌঁছে যাবে!`;
}

export function validateActivationCode(code: string): 'starter' | 'pro' | 'business' | null {
  const pattern = /^OG-(S|P|B)-[A-Z0-9]{5}$/;
  if (!pattern.test(code)) return null;
  const type = code.split('-')[1];
  if (type === 'S') return 'starter';
  if (type === 'P') return 'pro';
  if (type === 'B') return 'business';
  return null;
}
