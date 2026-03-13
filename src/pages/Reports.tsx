import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Header from '../components/layout/Header';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency } from '../utils/format';
import { STATUS_COLORS } from '../utils/constants';
import { isToday, isThisWeek, isThisMonth, format, subDays, eachDayOfInterval } from 'date-fns';
import type { OrderStatus, PaymentMethod } from '../types';

type ReportTab = 'daily' | 'weekly' | 'monthly';

export default function Reports() {
  const { t } = useTranslation();
  const { orders, loadOrders } = useOrderStore();
  const [tab, setTab] = useState<ReportTab>('daily');

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const reportOrders = useMemo(() => {
    switch (tab) {
      case 'daily': return orders.filter((o) => isToday(new Date(o.createdAt)));
      case 'weekly': return orders.filter((o) => isThisWeek(new Date(o.createdAt), { weekStartsOn: 6 }));
      case 'monthly': return orders.filter((o) => isThisMonth(new Date(o.createdAt)));
    }
  }, [orders, tab]);

  const stats = useMemo(() => {
    const totalOrders = reportOrders.length;
    const totalRevenue = reportOrders.reduce((s, o) => s + o.totalAmount, 0);
    const totalDelivery = reportOrders.reduce((s, o) => s + o.deliveryCharge, 0);
    const totalReturns = reportOrders.filter((o) => o.orderStatus === 'returned').length;
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const statusCounts: Record<string, number> = {};
    reportOrders.forEach((o) => { statusCounts[o.orderStatus] = (statusCounts[o.orderStatus] || 0) + 1; });
    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      name: t.status[status as OrderStatus],
      value: count,
      color: STATUS_COLORS[status as OrderStatus],
    }));

    const paymentAmounts: Record<string, number> = {};
    reportOrders.forEach((o) => { paymentAmounts[o.paymentMethod] = (paymentAmounts[o.paymentMethod] || 0) + o.totalAmount; });
    const paymentBreakdown = Object.entries(paymentAmounts).map(([method, amount]) => ({
      name: t.payment[method as PaymentMethod] || method,
      value: amount,
    }));

    const productMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    reportOrders.forEach((o) => o.items.forEach((i) => {
      if (!productMap[i.productName]) productMap[i.productName] = { name: i.productName, qty: 0, revenue: 0 };
      productMap[i.productName].qty += i.quantity;
      productMap[i.productName].revenue += i.totalPrice;
    }));
    const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const days = tab === 'daily' ? 1 : tab === 'weekly' ? 7 : 30;
    const interval = eachDayOfInterval({ start: subDays(new Date(), days - 1), end: new Date() });
    const dailyTrend = interval.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayOrders = orders.filter((o) => format(new Date(o.createdAt), 'yyyy-MM-dd') === dateStr);
      return {
        date: format(date, 'dd/MM'),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
      };
    });

    return { totalOrders, totalRevenue, totalDelivery, totalReturns, avgOrder, ordersByStatus, paymentBreakdown, topProducts, dailyTrend };
  }, [reportOrders, orders, tab, t]);

  return (
    <div>
      <Header title={t.report.title} />
      <div className="px-4 py-3 space-y-3">
        {/* Tab Bar */}
        <div className="flex bg-white rounded-lg p-0.5 shadow-xs border border-gray-100/60">
          {(['daily', 'weekly', 'monthly'] as ReportTab[]).map((r) => (
            <button
              key={r}
              onClick={() => setTab(r)}
              className={`flex-1 py-2 rounded-md text-[11px] font-bold transition-all duration-200 ${
                tab === r ? 'gradient-primary text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.report[r]}
            </button>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <p className="text-[10px] text-gray-500 font-medium">{t.report.totalOrders}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{stats.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <p className="text-[10px] text-gray-500 font-medium">{t.report.totalRevenue}</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums mt-0.5">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <p className="text-[10px] text-gray-500 font-medium">{t.report.avgOrderValue}</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums mt-0.5">{formatCurrency(stats.avgOrder)}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <p className="text-[10px] text-gray-500 font-medium">{t.report.totalReturns}</p>
            <p className="text-xl font-bold text-red-500 mt-0.5">{stats.totalReturns}</p>
          </div>
        </div>

        {/* Trend Chart */}
        {tab !== 'daily' && stats.dailyTrend.length > 1 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <h3 className="text-[11px] font-bold text-gray-800 mb-3">{t.report.totalRevenue}</h3>
            <ResponsiveContainer width="100%" height={200}>
              {tab === 'weekly' ? (
                <BarChart data={stats.dailyTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} width={45} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Bar dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={stats.dailyTrend}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} width={45} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#6366F1" strokeWidth={2.5} dot={{ fill: '#6366F1', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Order Status Pie */}
        {stats.ordersByStatus.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <h3 className="text-[11px] font-bold text-gray-800 mb-3">অর্ডার স্ট্যাটাস</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={130} height={130}>
                <PieChart>
                  <Pie data={stats.ordersByStatus} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2}>
                    {stats.ordersByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {stats.ordersByStatus.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-600 font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-900">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Top Products */}
        {stats.topProducts.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100/60 shadow-xs">
            <h3 className="text-xs font-bold text-gray-800 mb-3">{t.report.topProducts}</h3>
            <div className="space-y-0">
              {stats.topProducts.map((p, i) => (
                <div key={i} className={`flex items-center justify-between py-3 ${i < stats.topProducts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-primary-50 rounded-lg text-[10px] font-bold text-primary">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-800">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold tabular-nums">{formatCurrency(p.revenue)}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5">({p.qty})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.totalOrders === 0 && (
          <div className="bg-white rounded-xl border border-gray-100/60 shadow-xs p-8 text-center">
            <p className="text-sm text-gray-400">{t.report.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
}
