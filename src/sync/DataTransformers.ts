import { db } from '../db/database';
import type { Order, Customer, Product, Expense } from '../types';
import type { SyncTable } from '../types/sync';

// Get cloud UUID for a local ID
async function getCloudId(table: SyncTable, localId: number): Promise<string | null> {
  const mapping = await db.syncIdMap.where('[table+localId]').equals([table, localId]).first();
  return mapping?.cloudId || null;
}

// Get local ID for a cloud UUID
async function getLocalId(table: SyncTable, cloudId: string): Promise<number | null> {
  const mapping = await db.syncIdMap.where('[table+cloudId]').equals([table, cloudId]).first();
  return mapping?.localId || null;
}

// ── Local → Cloud transforms ──

function customerToCloud(c: Customer, userId: string) {
  return {
    user_id: userId,
    name: c.name,
    phone: c.phone,
    alt_phone: c.altPhone || '',
    email: c.email || '',
    address: c.address || '',
    area: c.area || '',
    total_orders: c.totalOrders || 0,
    total_spent: c.totalSpent || 0,
    total_due: c.totalDue || 0,
    last_order_date: c.lastOrderDate ? new Date(c.lastOrderDate).toISOString() : null,
    reliability_score: c.reliabilityScore || 'new',
    tags: c.tags || [],
    notes: c.notes || '',
    source: c.source || 'other',
    created_at: new Date(c.createdAt).toISOString(),
    updated_at: new Date(c.updatedAt).toISOString(),
  };
}

function productToCloud(p: Product, userId: string) {
  return {
    user_id: userId,
    name: p.name,
    sku: p.sku || '',
    category: p.category || '',
    variants: p.variants || [],
    buy_price: p.buyPrice || 0,
    sell_price: p.sellPrice || 0,
    stock: p.stock || 0,
    low_stock_alert: p.lowStockAlert || 5,
    image_url: p.imageUrl || '',
    is_active: p.isActive !== false,
    created_at: new Date(p.createdAt).toISOString(),
    updated_at: new Date(p.updatedAt).toISOString(),
  };
}

async function orderToCloud(o: Order, userId: string) {
  const customerCloudId = o.customerId ? await getCloudId('customers', o.customerId) : null;
  return {
    user_id: userId,
    order_number: o.orderNumber,
    customer_id: customerCloudId,
    customer_name: o.customerName || '',
    customer_phone: o.customerPhone || '',
    items: o.items || [],
    subtotal: o.subtotal || 0,
    delivery_charge: o.deliveryCharge || 0,
    discount: o.discount || 0,
    total_amount: o.totalAmount || 0,
    payment_method: o.paymentMethod || 'cod',
    payment_status: o.paymentStatus || 'unpaid',
    paid_amount: o.paidAmount || 0,
    order_status: o.orderStatus || 'new',
    delivery_address: o.deliveryAddress || '',
    delivery_area: o.deliveryArea || '',
    delivery_provider: o.deliveryProvider || '',
    tracking_number: o.trackingNumber || '',
    notes: o.notes || '',
    source: o.source || 'other',
    created_at: new Date(o.createdAt).toISOString(),
    updated_at: new Date(o.updatedAt).toISOString(),
  };
}

function expenseToCloud(e: Expense, userId: string) {
  return {
    user_id: userId,
    date: new Date(e.date).toISOString(),
    category: e.category || 'other',
    description: e.description || '',
    amount: e.amount || 0,
    created_at: new Date(e.createdAt).toISOString(),
  };
}

// ── Cloud → Local transforms ──

function customerFromCloud(row: Record<string, unknown>): Omit<Customer, 'id'> {
  return {
    cloudId: row.id as string,
    name: (row.name as string) || '',
    phone: (row.phone as string) || '',
    altPhone: (row.alt_phone as string) || '',
    email: (row.email as string) || '',
    address: (row.address as string) || '',
    area: (row.area as string) || '',
    totalOrders: (row.total_orders as number) || 0,
    totalSpent: (row.total_spent as number) || 0,
    totalDue: (row.total_due as number) || 0,
    lastOrderDate: row.last_order_date ? new Date(row.last_order_date as string) : null,
    reliabilityScore: (row.reliability_score as Customer['reliabilityScore']) || 'new',
    tags: (row.tags as string[]) || [],
    notes: (row.notes as string) || '',
    source: (row.source as Customer['source']) || 'other',
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function productFromCloud(row: Record<string, unknown>): Omit<Product, 'id'> {
  return {
    cloudId: row.id as string,
    name: (row.name as string) || '',
    sku: (row.sku as string) || '',
    category: (row.category as string) || '',
    variants: (row.variants as Product['variants']) || [],
    buyPrice: (row.buy_price as number) || 0,
    sellPrice: (row.sell_price as number) || 0,
    stock: (row.stock as number) || 0,
    lowStockAlert: (row.low_stock_alert as number) || 5,
    imageUrl: (row.image_url as string) || '',
    isActive: (row.is_active as boolean) !== false,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

async function orderFromCloud(row: Record<string, unknown>): Promise<Omit<Order, 'id'>> {
  let localCustomerId = 0;
  if (row.customer_id) {
    const cid = await getLocalId('customers', row.customer_id as string);
    localCustomerId = cid || 0;
  }

  return {
    cloudId: row.id as string,
    orderNumber: (row.order_number as string) || '',
    customerId: localCustomerId,
    customerName: (row.customer_name as string) || '',
    customerPhone: (row.customer_phone as string) || '',
    items: (row.items as Order['items']) || [],
    subtotal: (row.subtotal as number) || 0,
    deliveryCharge: (row.delivery_charge as number) || 0,
    discount: (row.discount as number) || 0,
    totalAmount: (row.total_amount as number) || 0,
    paymentMethod: (row.payment_method as Order['paymentMethod']) || 'cod',
    paymentStatus: (row.payment_status as Order['paymentStatus']) || 'unpaid',
    paidAmount: (row.paid_amount as number) || 0,
    orderStatus: (row.order_status as Order['orderStatus']) || 'new',
    deliveryAddress: (row.delivery_address as string) || '',
    deliveryArea: (row.delivery_area as string) || '',
    deliveryProvider: (row.delivery_provider as string) || '',
    trackingNumber: (row.tracking_number as string) || '',
    notes: (row.notes as string) || '',
    source: (row.source as Order['source']) || 'other',
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function expenseFromCloud(row: Record<string, unknown>): Omit<Expense, 'id'> {
  return {
    cloudId: row.id as string,
    date: new Date(row.date as string),
    category: (row.category as Expense['category']) || 'other',
    description: (row.description as string) || '',
    amount: (row.amount as number) || 0,
    createdAt: new Date(row.created_at as string),
  };
}

// ── Exports ──

export const transforms = {
  customerToCloud,
  productToCloud,
  orderToCloud,
  expenseToCloud,
  customerFromCloud,
  productFromCloud,
  orderFromCloud,
  expenseFromCloud,
  getCloudId,
  getLocalId,
};
