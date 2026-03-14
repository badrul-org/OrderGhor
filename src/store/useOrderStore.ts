import { create } from 'zustand';
import { db } from '../db/database';
import { syncService } from '../sync/SyncService';
import type { Order, OrderStatus } from '../types';

interface OrderState {
  orders: Order[];
  loading: boolean;
  loadOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<number>;
  updateOrder: (id: number, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: number) => Promise<void>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  getOrdersByCustomer: (customerId: number) => Promise<Order[]>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  loading: false,

  loadOrders: async () => {
    set({ loading: true });
    const orders = await db.orders.orderBy('createdAt').reverse().toArray();
    set({ orders, loading: false });
  },

  addOrder: async (order) => {
    const id = (await db.orders.add(order)) as number;
    const newOrder = { ...order, id };
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    syncService.enqueue('orders', 'create', id);
    return id;
  },

  updateOrder: async (id, updates) => {
    await db.orders.update(id, { ...updates, updatedAt: new Date() });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...updates, updatedAt: new Date() } : o)),
    }));
    syncService.enqueue('orders', 'update', id);
  },

  deleteOrder: async (id) => {
    await db.orders.delete(id);
    set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
    syncService.enqueue('orders', 'delete', id);
  },

  updateOrderStatus: async (id, status) => {
    await db.orders.update(id, { orderStatus: status, updatedAt: new Date() });
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, orderStatus: status, updatedAt: new Date() } : o)),
    }));
    syncService.enqueue('orders', 'update', id);
  },

  getOrdersByCustomer: async (customerId) => {
    return db.orders.where('customerId').equals(customerId).reverse().sortBy('createdAt');
  },
}));
