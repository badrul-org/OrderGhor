// Order Status Flow: new → confirmed → processing → shipped → delivered
//                                                   ↘ returned
//                    new → cancelled

export type OrderStatus = 'new' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'cancelled';

export type PaymentStatus = 'paid' | 'unpaid' | 'partial' | 'cod_pending' | 'refunded';

export type PaymentMethod = 'bkash' | 'nagad' | 'rocket' | 'cod' | 'bank' | 'partial' | 'other';

export type OrderSource = 'facebook' | 'messenger' | 'whatsapp' | 'instagram' | 'phone' | 'other';

export type LicenseType = 'trial' | 'starter' | 'pro' | 'business';

export type ReliabilityScore = 'excellent' | 'good' | 'average' | 'risky' | 'new';

export type ExpenseCategory = 'product_cost' | 'delivery' | 'packaging' | 'ads' | 'rent' | 'salary' | 'other';

export interface OrderItem {
  productId?: number;
  productName: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id?: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  orderStatus: OrderStatus;
  deliveryAddress: string;
  deliveryArea: string;
  deliveryProvider: string;
  trackingNumber: string;
  notes: string;
  source: OrderSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  address: string;
  area: string;
  totalOrders: number;
  totalSpent: number;
  totalDue: number;
  lastOrderDate: Date | null;
  reliabilityScore: ReliabilityScore;
  tags: string[];
  notes: string;
  source: OrderSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductVariant {
  name: string;
  stock: number;
  additionalPrice: number;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  variants: ProductVariant[];
  buyPrice: number;
  sellPrice: number;
  stock: number;
  lowStockAlert: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyLedger {
  id?: number;
  date: string;
  totalOrders: number;
  totalSales: number;
  totalDeliveryCharges: number;
  totalDiscounts: number;
  totalReturns: number;
  totalRefunds: number;
  netRevenue: number;
  newCustomers: number;
  repeatCustomers: number;
}

export interface Expense {
  id?: number;
  date: Date;
  category: ExpenseCategory;
  description: string;
  amount: number;
  createdAt: Date;
}

export interface AppSettings {
  id?: number;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  logo: string;
  language: 'bn' | 'en';
  currency: 'BDT';
  defaultDeliveryCharge: number;
  defaultPaymentMethod: string;
  activationCode: string;
  licenseType: LicenseType;
  trialOrdersUsed: number;
  trialMaxOrders: number;
  activatedAt: Date | null;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredToday: number;
  returnedToday: number;
  unpaidAmount: number;
  totalCustomers: number;
  lowStockProducts: number;
}

export interface ReportData {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  totalProfit: number;
  totalDeliveryCharges: number;
  totalReturns: number;
  averageOrderValue: number;
  topProducts: { name: string; quantity: number; revenue: number }[];
  topCustomers: { name: string; orders: number; spent: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
  paymentBreakdown: { method: PaymentMethod; amount: number }[];
  dailyTrend: { date: string; orders: number; revenue: number }[];
}

export interface KanbanColumn {
  id: OrderStatus;
  title: string;
  color: string;
  icon: string;
  orders: Order[];
}
