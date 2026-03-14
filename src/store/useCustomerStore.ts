import { create } from 'zustand';
import { db } from '../db/database';
import { syncService } from '../sync/SyncService';
import type { Customer, ReliabilityScore } from '../types';

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  loadCustomers: () => Promise<void>;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<number>;
  updateCustomer: (id: number, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: number) => Promise<void>;
  findByPhone: (phone: string) => Promise<Customer | undefined>;
  getOrCreateCustomer: (name: string, phone: string, address: string, area: string, source: Customer['source']) => Promise<number>;
}

export function calculateReliability(totalOrders: number, returnRate: number, hasPaymentIssues: boolean): ReliabilityScore {
  if (totalOrders === 0) return 'new';
  if (returnRate > 0.3 || hasPaymentIssues) return 'risky';
  if (totalOrders >= 5 && returnRate < 0.05) return 'excellent';
  if (totalOrders >= 3 && returnRate < 0.15) return 'good';
  return 'average';
}

export const useCustomerStore = create<CustomerState>((set) => ({
  customers: [],
  loading: false,

  loadCustomers: async () => {
    set({ loading: true });
    const customers = await db.customers.orderBy('createdAt').reverse().toArray();
    set({ customers, loading: false });
  },

  addCustomer: async (customer) => {
    const id = (await db.customers.add(customer)) as number;
    const newCustomer = { ...customer, id };
    set((state) => ({ customers: [newCustomer, ...state.customers] }));
    syncService.enqueue('customers', 'create', id);
    return id;
  },

  updateCustomer: async (id, updates) => {
    await db.customers.update(id, { ...updates, updatedAt: new Date() });
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c)),
    }));
    syncService.enqueue('customers', 'update', id);
  },

  deleteCustomer: async (id) => {
    await db.customers.delete(id);
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));
    syncService.enqueue('customers', 'delete', id);
  },

  findByPhone: async (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return undefined;
    return db.customers.where('phone').equals(cleaned).first();
  },

  getOrCreateCustomer: async (name, phone, address, area, source) => {
    const cleaned = phone.replace(/\D/g, '');
    const existing = await db.customers.where('phone').equals(cleaned).first();
    if (existing?.id) {
      await db.customers.update(existing.id, {
        name: name || existing.name,
        address: address || existing.address,
        area: area || existing.area,
        updatedAt: new Date(),
      });
      syncService.enqueue('customers', 'update', existing.id);
      return existing.id;
    }

    const now = new Date();
    const newCustomer: Omit<Customer, 'id'> = {
      name,
      phone: cleaned,
      altPhone: '',
      email: '',
      address,
      area,
      totalOrders: 0,
      totalSpent: 0,
      totalDue: 0,
      lastOrderDate: null,
      reliabilityScore: 'new',
      tags: [],
      notes: '',
      source,
      createdAt: now,
      updatedAt: now,
    };
    const id = (await db.customers.add(newCustomer)) as number;
    set((state) => ({ customers: [{ ...newCustomer, id }, ...state.customers] }));
    syncService.enqueue('customers', 'create', id);
    return id;
  },
}));
