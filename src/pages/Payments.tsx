import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import Header from '../components/layout/Header';
import StatCard from '../components/shared/StatCard';
import PaymentBadge from '../components/shared/PaymentBadge';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency, formatRelativeDate } from '../utils/format';
import { getWhatsAppUrl, getPaymentReminderMessage } from '../utils/parseOrder';
import type { PaymentStatus } from '../types';

export default function Payments() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orders, loadOrders } = useOrderStore();
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all');

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const stats = useMemo(() => {
    const totalReceived = orders.reduce((s, o) => s + o.paidAmount, 0);
    const totalPending = orders.filter((o) => ['unpaid', 'partial'].includes(o.paymentStatus)).reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0);
    const totalAtRisk = orders.filter((o) => o.paymentStatus === 'cod_pending').reduce((s, o) => s + o.totalAmount, 0);
    return { totalReceived, totalPending, totalAtRisk };
  }, [orders]);

  const filtered = useMemo(() => {
    if (filter === 'all') return orders;
    return orders.filter((o) => o.paymentStatus === filter);
  }, [orders, filter]);

  const handleWhatsAppReminder = (order: typeof orders[0]) => {
    const due = order.totalAmount - order.paidAmount;
    const msg = getPaymentReminderMessage(order.customerName, due, order.orderNumber);
    window.open(getWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  return (
    <div>
      <Header title={t.nav.payments} />
      <div className="px-4 py-3 space-y-3">
        {/* Summary Cards */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          <StatCard title={t.payment.totalReceived} value={formatCurrency(stats.totalReceived)} icon={CheckCircle} color="text-emerald-600" bgColor="bg-emerald-50" />
          <StatCard title={t.payment.totalPending} value={formatCurrency(stats.totalPending)} icon={Clock} color="text-red-600" bgColor="bg-red-50" />
          <StatCard title={t.payment.totalAtRisk} value={formatCurrency(stats.totalAtRisk)} icon={AlertTriangle} color="text-purple-600" bgColor="bg-purple-50" />
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
          {(['all', 'paid', 'unpaid', 'partial', 'cod_pending'] as (PaymentStatus | 'all')[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap border transition-all duration-200 ${
                filter === s ? 'gradient-primary text-white shadow-sm border-transparent' : 'bg-white text-gray-600 border-gray-200 shadow-sm'
              }`}
            >
              {s === 'all' ? t.common.all : t.payment[s]}
            </button>
          ))}
        </div>

        {/* Order List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100/60 shadow-xs p-8 text-center">
            <p className="text-sm text-gray-400">{t.common.noData}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100/60 shadow-xs overflow-hidden divide-y divide-gray-100/80">
            {filtered.map((order) => {
              const due = order.totalAmount - order.paidAmount;
              return (
                <div key={order.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <button onClick={() => navigate(`/orders/${order.id}`)} className="text-[10px] text-gray-400 font-mono hover:text-primary transition-colors">
                      {order.orderNumber}
                    </button>
                    <PaymentBadge status={order.paymentStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatRelativeDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{formatCurrency(order.totalAmount)}</p>
                      {due > 0 && <p className="text-xs text-red-500 font-semibold tabular-nums mt-0.5">বাকি: {formatCurrency(due)}</p>}
                    </div>
                  </div>
                  {due > 0 && (
                    <button
                      onClick={() => handleWhatsAppReminder(order)}
                      className="mt-2 w-full h-8 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-semibold active:bg-green-100 transition-colors"
                    >
                      <MessageCircle size={14} /> WhatsApp রিমাইন্ডার
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
