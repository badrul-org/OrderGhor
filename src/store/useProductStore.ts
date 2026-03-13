import { create } from 'zustand';
import { db } from '../db/database';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  loading: boolean;
  loadProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id'>) => Promise<number>;
  updateProduct: (id: number, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  updateStock: (id: number, change: number) => Promise<void>;
  getLowStockProducts: () => Product[];
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: false,

  loadProducts: async () => {
    set({ loading: true });
    const products = await db.products.filter((p) => p.isActive !== false).toArray();
    set({ products, loading: false });
  },

  addProduct: async (product) => {
    const id = (await db.products.add(product)) as number;
    const newProduct = { ...product, id };
    set((state) => ({ products: [newProduct, ...state.products] }));
    return id;
  },

  updateProduct: async (id, updates) => {
    await db.products.update(id, { ...updates, updatedAt: new Date() });
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p)),
    }));
  },

  deleteProduct: async (id) => {
    await db.products.update(id, { isActive: false });
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
  },

  updateStock: async (id, change) => {
    const product = get().products.find((p) => p.id === id);
    if (!product) return;
    const newStock = Math.max(0, product.stock + change);
    await db.products.update(id, { stock: newStock });
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, stock: newStock } : p)),
    }));
  },

  getLowStockProducts: () => {
    return get().products.filter((p) => p.stock <= p.lowStockAlert);
  },
}));
