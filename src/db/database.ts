import Dexie, { type Table } from 'dexie';
import type { Order, Customer, Product, DailyLedger, Expense, AppSettings } from '../types';

export class OrderGhorDB extends Dexie {
  orders!: Table<Order>;
  customers!: Table<Customer>;
  products!: Table<Product>;
  dailyLedger!: Table<DailyLedger>;
  expenses!: Table<Expense>;
  settings!: Table<AppSettings>;

  constructor() {
    super('OrderGhorDB');
    this.version(1).stores({
      orders: '++id, orderNumber, customerId, orderStatus, paymentStatus, createdAt, [orderStatus+createdAt]',
      customers: '++id, phone, name, reliabilityScore, createdAt',
      products: '++id, name, category, sku, isActive',
      dailyLedger: '++id, &date',
      expenses: '++id, date, category',
      settings: '++id',
    });
  }
}

export const db = new OrderGhorDB();

export async function getSettings(): Promise<AppSettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) return existing;

  const defaults: AppSettings = {
    businessName: 'আমার দোকান',
    ownerName: '',
    phone: '',
    address: '',
    logo: '',
    language: 'bn',
    currency: 'BDT',
    defaultDeliveryCharge: 60,
    defaultPaymentMethod: 'bkash',
    activationCode: '',
    licenseType: 'trial',
    trialOrdersUsed: 0,
    trialMaxOrders: 10,
    activatedAt: null,
  };

  const id = await db.settings.add(defaults);
  return { ...defaults, id: id as number };
}
