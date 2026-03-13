import { db } from './database';
import type { Customer, Product, Order } from '../types';

export async function seedDemoData() {
  const customerCount = await db.customers.count();
  if (customerCount > 0) return; // Already seeded

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  // Demo customers
  const customers: Omit<Customer, 'id'>[] = [
    { name: 'ফাতেমা আক্তার', phone: '01712345678', altPhone: '', email: '', address: 'মিরপুর ১০, ঢাকা', area: 'dhaka', totalOrders: 3, totalSpent: 4500, totalDue: 0, lastOrderDate: now, reliabilityScore: 'good', tags: [], notes: '', source: 'messenger', createdAt: twoDaysAgo, updatedAt: now },
    { name: 'রহিমা বেগম', phone: '01898765432', altPhone: '', email: '', address: 'উত্তরা ১২, ঢাকা', area: 'dhaka', totalOrders: 1, totalSpent: 1800, totalDue: 1800, lastOrderDate: yesterday, reliabilityScore: 'new', tags: [], notes: '', source: 'facebook', createdAt: yesterday, updatedAt: yesterday },
    { name: 'সুমাইয়া ইসলাম', phone: '01511223344', altPhone: '', email: '', address: 'চট্টগ্রাম সদর', area: 'chittagong', totalOrders: 5, totalSpent: 8700, totalDue: 0, lastOrderDate: now, reliabilityScore: 'excellent', tags: ['VIP'], notes: 'নিয়মিত গ্রাহক', source: 'whatsapp', createdAt: twoDaysAgo, updatedAt: now },
  ];

  const customerIds = await db.customers.bulkAdd(customers, { allKeys: true }) as number[];

  // Demo products
  const products: Omit<Product, 'id'>[] = [
    { name: 'সিল্ক শাড়ি', sku: 'SAR-001', category: 'clothing', variants: [], buyPrice: 800, sellPrice: 1500, stock: 25, lowStockAlert: 5, imageUrl: '', isActive: true, createdAt: twoDaysAgo, updatedAt: now },
    { name: 'লিপস্টিক সেট', sku: 'COS-001', category: 'cosmetics', variants: [], buyPrice: 200, sellPrice: 450, stock: 50, lowStockAlert: 10, imageUrl: '', isActive: true, createdAt: twoDaysAgo, updatedAt: now },
    { name: 'কটন থ্রি-পিস', sku: 'CLO-002', category: 'clothing', variants: [], buyPrice: 600, sellPrice: 1200, stock: 3, lowStockAlert: 5, imageUrl: '', isActive: true, createdAt: twoDaysAgo, updatedAt: now },
    { name: 'ফেস ওয়াশ', sku: 'COS-002', category: 'cosmetics', variants: [], buyPrice: 150, sellPrice: 350, stock: 30, lowStockAlert: 5, imageUrl: '', isActive: true, createdAt: twoDaysAgo, updatedAt: now },
  ];

  await db.products.bulkAdd(products);

  // Demo orders
  const orders: Omit<Order, 'id'>[] = [
    {
      orderNumber: 'ORD-20260313-001', customerId: customerIds[0], customerName: 'ফাতেমা আক্তার', customerPhone: '01712345678',
      items: [{ productName: 'সিল্ক শাড়ি', variant: 'লাল', quantity: 1, unitPrice: 1500, totalPrice: 1500 }],
      subtotal: 1500, deliveryCharge: 60, discount: 0, totalAmount: 1560,
      paymentMethod: 'bkash', paymentStatus: 'paid', paidAmount: 1560,
      orderStatus: 'delivered', deliveryAddress: 'মিরপুর ১০, ঢাকা', deliveryArea: 'dhaka',
      deliveryProvider: 'pathao', trackingNumber: 'PT12345', notes: '', source: 'messenger',
      createdAt: twoDaysAgo, updatedAt: now,
    },
    {
      orderNumber: 'ORD-20260313-002', customerId: customerIds[1], customerName: 'রহিমা বেগম', customerPhone: '01898765432',
      items: [
        { productName: 'লিপস্টিক সেট', variant: 'ম্যাট', quantity: 2, unitPrice: 450, totalPrice: 900 },
        { productName: 'ফেস ওয়াশ', variant: '', quantity: 1, unitPrice: 350, totalPrice: 350 },
      ],
      subtotal: 1250, deliveryCharge: 60, discount: 0, totalAmount: 1310,
      paymentMethod: 'cod', paymentStatus: 'cod_pending', paidAmount: 0,
      orderStatus: 'shipped', deliveryAddress: 'উত্তরা ১২, ঢাকা', deliveryArea: 'dhaka',
      deliveryProvider: 'steadfast', trackingNumber: 'SF67890', notes: '', source: 'facebook',
      createdAt: yesterday, updatedAt: yesterday,
    },
    {
      orderNumber: 'ORD-20260313-003', customerId: customerIds[2], customerName: 'সুমাইয়া ইসলাম', customerPhone: '01511223344',
      items: [{ productName: 'কটন থ্রি-পিস', variant: 'নীল - M', quantity: 1, unitPrice: 1200, totalPrice: 1200 }],
      subtotal: 1200, deliveryCharge: 120, discount: 50, totalAmount: 1270,
      paymentMethod: 'nagad', paymentStatus: 'paid', paidAmount: 1270,
      orderStatus: 'processing', deliveryAddress: 'চট্টগ্রাম সদর', deliveryArea: 'chittagong',
      deliveryProvider: 'redx', trackingNumber: '', notes: 'VIP গ্রাহক — দ্রুত পাঠান', source: 'whatsapp',
      createdAt: now, updatedAt: now,
    },
    {
      orderNumber: 'ORD-20260313-004', customerId: customerIds[0], customerName: 'ফাতেমা আক্তার', customerPhone: '01712345678',
      items: [{ productName: 'সিল্ক শাড়ি', variant: 'সবুজ', quantity: 2, unitPrice: 1500, totalPrice: 3000 }],
      subtotal: 3000, deliveryCharge: 60, discount: 100, totalAmount: 2960,
      paymentMethod: 'bkash', paymentStatus: 'partial', paidAmount: 1500,
      orderStatus: 'new', deliveryAddress: 'মিরপুর ১০, ঢাকা', deliveryArea: 'dhaka',
      deliveryProvider: '', trackingNumber: '', notes: 'বাকি টাকা ডেলিভারিতে দিবে', source: 'messenger',
      createdAt: now, updatedAt: now,
    },
  ];

  await db.orders.bulkAdd(orders);
}
