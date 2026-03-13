import type { OrderStatus, PaymentStatus, PaymentMethod, OrderSource } from '../types';

export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'returned', 'cancelled'];

export const PAYMENT_STATUSES: PaymentStatus[] = ['paid', 'unpaid', 'partial', 'cod_pending', 'refunded'];

export const PAYMENT_METHODS: PaymentMethod[] = ['bkash', 'nagad', 'rocket', 'cod', 'bank', 'other'];

export const ORDER_SOURCES: OrderSource[] = ['facebook', 'messenger', 'whatsapp', 'instagram', 'phone', 'other'];

export const DELIVERY_PROVIDERS = [
  { id: 'pathao', name: 'পাঠাও' },
  { id: 'steadfast', name: 'স্টেডফাস্ট' },
  { id: 'redx', name: 'রেডএক্স' },
  { id: 'paperfly', name: 'পেপারফ্লাই' },
  { id: 'sundorbon', name: 'সুন্দরবন' },
  { id: 'sa_paribahan', name: 'এসএ পরিবহন' },
  { id: 'other', name: 'অন্যান্য' },
];

export const DELIVERY_AREAS = [
  { id: 'dhaka', name: 'ঢাকা', charge: 60 },
  { id: 'chittagong', name: 'চট্টগ্রাম', charge: 120 },
  { id: 'sylhet', name: 'সিলেট', charge: 120 },
  { id: 'rajshahi', name: 'রাজশাহী', charge: 120 },
  { id: 'khulna', name: 'খুলনা', charge: 120 },
  { id: 'barishal', name: 'বরিশাল', charge: 120 },
  { id: 'rangpur', name: 'রংপুর', charge: 120 },
  { id: 'mymensingh', name: 'ময়মনসিংহ', charge: 120 },
  { id: 'outside_dhaka', name: 'ঢাকার বাইরে', charge: 150 },
];

export const PRODUCT_CATEGORIES = [
  { id: 'clothing', name: 'কাপড়' },
  { id: 'cosmetics', name: 'কসমেটিক্স' },
  { id: 'food', name: 'খাবার' },
  { id: 'accessories', name: 'অ্যাক্সেসরিজ' },
  { id: 'electronics', name: 'ইলেকট্রনিক্স' },
  { id: 'other', name: 'অন্যান্য' },
];

export const STATUS_COLORS: Record<OrderStatus, string> = {
  new: '#3B82F6',
  confirmed: '#8B5CF6',
  processing: '#F59E0B',
  shipped: '#06B6D4',
  delivered: '#10B981',
  returned: '#EF4444',
  cancelled: '#6B7280',
};

export const STATUS_BG_CLASSES: Record<OrderStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  returned: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export const PAYMENT_STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  unpaid: 'bg-red-100 text-red-700',
  partial: 'bg-amber-100 text-amber-700',
  cod_pending: 'bg-purple-100 text-purple-700',
  refunded: 'bg-gray-100 text-gray-700',
};
