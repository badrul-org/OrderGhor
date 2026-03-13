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

export interface ActivationResult {
  valid: boolean;
  licenseType?: 'starter' | 'pro' | 'business';
  error?: string;
  offline?: boolean;
}

function isValidCodeFormat(code: string): boolean {
  return /^OG-(S|P|B)-[A-HJ-NP-Z2-9]{8}$/.test(code);
}

export async function validateActivationCode(code: string): Promise<ActivationResult> {
  const trimmed = code.trim().toUpperCase();

  if (!isValidCodeFormat(trimmed)) {
    return { valid: false, error: 'Invalid code format' };
  }

  try {
    const response = await fetch('/api/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    });

    if (!response.ok) {
      return { valid: false, error: 'Server error. Please try again.', offline: true };
    }

    const data = await response.json();
    if (data.valid && data.licenseType) {
      return { valid: true, licenseType: data.licenseType };
    }
    return { valid: false, error: data.error || 'Invalid code' };
  } catch {
    return {
      valid: false,
      error: 'ইন্টারনেট সংযোগ নেই। অনুগ্রহ করে ইন্টারনেট চালু করে আবার চেষ্টা করুন।',
      offline: true,
    };
  }
}
