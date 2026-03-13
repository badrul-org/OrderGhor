import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, TrendingUp, Clock, AlertTriangle,
  Plus, ClipboardList, Users, BarChart3, Package, ChevronRight, ArrowUpRight,
} from 'lucide-react';
import Header from '../components/layout/Header';
import StatCard from '../components/shared/StatCard';
import OrderStatusBadge from '../components/shared/OrderStatusBadge';
import PaymentBadge from '../components/shared/PaymentBadge';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatCurrency, getGreeting, getTodayDateBangla, formatRelativeDate } from '../utils/format';
import { isToday } from 'date-fns';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orders, loadOrders } = useOrderStore();
  const { customers, loadCustomers } = useCustomerStore();
  const { products, loadProducts } = useProductStore();
  const { settings, loadSettings } = useSettingsStore();
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0, shippedOrders: 0,
    deliveredToday: 0, returnedToday: 0, unpaidAmount: 0, totalCustomers: 0,
    lowStockProducts: 0,
  });

  useEffect(() => {
    loadSettings();
    loadOrders();
    loadCustomers();
    loadProducts();
  }, [loadSettings, loadOrders, loadCustomers, loadProducts]);

  useEffect(() => {
    const todayOrders = orders.filter((o) => isToday(new Date(o.createdAt)));
    const pending = orders.filter((o) => ['new', 'confirmed', 'processing'].includes(o.orderStatus));
    const unpaid = orders.filter((o) => ['unpaid', 'partial'].includes(o.paymentStatus));
    const lowStock = products.filter((p) => p.stock <= p.lowStockAlert);

    setStats({
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((s, o) => s + o.totalAmount, 0),
      pendingOrders: pending.length,
      shippedOrders: orders.filter((o) => o.orderStatus === 'shipped').length,
      deliveredToday: todayOrders.filter((o) => o.orderStatus === 'delivered').length,
      returnedToday: todayOrders.filter((o) => o.orderStatus === 'returned').length,
      unpaidAmount: unpaid.reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0),
      totalCustomers: customers.length,
      lowStockProducts: lowStock.length,
    });
  }, [orders, customers, products]);

  const recentOrders = orders.slice(0, 5);
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockAlert).slice(0, 3);
  const trialRemaining = settings && settings.licenseType === 'trial'
    ? settings.trialMaxOrders - settings.trialOrdersUsed : null;

  return (
    <div>
      <Header title={t.app.name} showSettings />

      <div className="px-4 py-3 space-y-4">
        {/* Welcome */}
        <div className="relative overflow-hidden rounded-xl gradient-primary p-6 text-white animate-fadeIn">
          <div className="absolute inset-0 pattern-dots opacity-30" />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-xs text-white/70 font-medium">{getGreeting()}</p>
            <p className="text-lg font-bold mt-0.5 tracking-tight">{settings?.businessName || t.app.name}</p>
            <p className="text-[11px] text-white/50 mt-0.5 font-medium">{getTodayDateBangla()}</p>
          </div>
        </div>

        {/* Trial */}
        {trialRemaining !== null && trialRemaining >= 0 && (
          <div className="bg-amber-50/90 border border-amber-200/60 rounded-lg p-2.5 flex items-center justify-between animate-slideUp shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-[11px] text-amber-800 font-medium">
                {t.settings.trialRemaining} <strong>{trialRemaining}</strong> {t.settings.ordersRemaining}
              </span>
            </div>
            <button
              onClick={() => navigate('/activation')}
              className="text-[11px] font-bold text-primary bg-white px-2.5 py-1 rounded-md shadow-xs active:scale-95 transition-transform"
            >
              {t.settings.upgradePro}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard title={t.dashboard.todayOrders} value={stats.todayOrders} icon={ShoppingBag} color="text-indigo-600" bgColor="bg-indigo-50" />
          <StatCard title={t.dashboard.todayRevenue} value={formatCurrency(stats.todayRevenue)} icon={TrendingUp} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard title={t.dashboard.pendingOrders} value={stats.pendingOrders} icon={Clock} color="text-amber-600" bgColor="bg-amber-50" />
          <StatCard title={t.dashboard.unpaidAmount} value={formatCurrency(stats.unpaidAmount)} icon={AlertTriangle} color="text-rose-600" bgColor="bg-rose-50" />
        </div>

        {/* Quick Actions */}
        <div>
            <h2 className="section-label mb-2">{t.dashboard.quickActions}</h2>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/new-order')} className="flex items-center gap-2.5 gradient-primary text-white p-4 rounded-xl active:scale-[0.98] transition-all shadow-md btn-press">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                <Plus size={17} />
              </div>
              <span className="text-[13px] font-bold">{t.nav.newOrder}</span>
            </button>
            {[
              { path: '/orders', icon: ClipboardList, label: t.nav.orders, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { path: '/customers', icon: Users, label: t.nav.customers, color: 'text-violet-600', bg: 'bg-violet-50' },
              { path: '/reports', icon: BarChart3, label: t.nav.reports, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map((item) => (
              <button key={item.path} onClick={() => navigate(item.path)} className="flex items-center gap-2.5 surface-card p-4 rounded-xl active:bg-gray-50 card-hover btn-press">
                <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center`}>
                  <item.icon size={16} className={item.color} />
                </div>
                <span className="text-[13px] font-semibold text-gray-700">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Low Stock */}
        {lowStockProducts.length > 0 && (
          <div className="animate-slideUp">
            <h2 className="section-label mb-2">{t.dashboard.lowStockAlert}</h2>
            <div className="surface-card rounded-xl overflow-hidden">
              {lowStockProducts.map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-5 py-3.5 ${i < lowStockProducts.length - 1 ? 'border-b border-slate-100' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${p.stock === 0 ? 'bg-rose-50' : 'bg-amber-50'}`}>
                      <Package size={14} className={p.stock === 0 ? 'text-rose-500' : 'text-amber-500'} />
                    </div>
                    <span className="text-[13px] font-medium text-gray-800">{p.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.stock === 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.product.stock}: {p.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="animate-slideUp">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-label">{t.dashboard.recentOrders}</h2>
            {orders.length > 5 && (
              <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-[11px] text-primary font-semibold">
                {t.dashboard.viewAll} <ArrowUpRight size={12} />
              </button>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <div className="surface-card rounded-xl p-10 text-center">
              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <ShoppingBag size={18} className="text-primary/40" />
              </div>
              <p className="text-[13px] text-gray-400">{t.order.noOrders}</p>
            </div>
          ) : (
            <div className="surface-card rounded-xl overflow-hidden divide-y divide-gray-100/80">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full px-5 py-4 text-left active:bg-gray-50 transition-all flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</span>
                      <OrderStatusBadge status={order.orderStatus} />
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{order.customerName}</p>
                    <p className="text-[10px] text-gray-400">{formatRelativeDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold text-gray-900 tabular-nums">{formatCurrency(order.totalAmount)}</p>
                    <div className="mt-0.5"><PaymentBadge status={order.paymentStatus} /></div>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
