import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Phone, ChevronRight, MessageCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import SearchBar from '../components/shared/SearchBar';
import EmptyState from '../components/shared/EmptyState';
import { useTranslation } from '../i18n';
import { useCustomerStore } from '../store/useCustomerStore';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency, formatRelativeDate } from '../utils/format';
import type { Customer, ReliabilityScore } from '../types';

const reliabilityConfig: Record<ReliabilityScore, { bg: string; text: string; dot: string }> = {
  excellent: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  good: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  average: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' },
  risky: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  new: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
};

function getInitials(name: string): string {
  return name.charAt(0);
}

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-cyan-500'];

export default function Customers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { customers, loadCustomers } = useCustomerStore();
  const { orders, loadOrders } = useOrderStore();
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => { loadCustomers(); loadOrders(); }, [loadCustomers, loadOrders]);

  const filtered = useMemo(() => {
    if (!search) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, search]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter((o) => o.customerId === selectedCustomer.id);
  }, [selectedCustomer, orders]);

  if (selectedCustomer) {
    const config = reliabilityConfig[selectedCustomer.reliabilityScore];
    return (
      <div>
        <Header title={selectedCustomer.name} showBack />
        <div className="px-4 py-3 space-y-3">
          {/* Customer Info Card */}
          <div className="bg-white rounded-xl p-5 shadow-xs border border-gray-100/60 animate-slideUp">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-11 h-11 rounded-xl ${avatarColors[(selectedCustomer.id || 0) % avatarColors.length]} flex items-center justify-center text-white text-base font-bold shadow-md`}>
                {getInitials(selectedCustomer.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900">{selectedCustomer.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${config.bg} ${config.text}`}>
                    <div className={`w-1 h-1 rounded-full ${config.dot}`} />
                    {t.customer[selectedCustomer.reliabilityScore === 'new' ? 'newCustomer' : selectedCustomer.reliabilityScore]}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <a href={`tel:${selectedCustomer.phone}`} className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[11px] font-semibold active:bg-emerald-100 transition-colors">
                <Phone size={13} /> কল করুন
              </a>
              <a href={`https://wa.me/88${selectedCustomer.phone}`} target="_blank" rel="noreferrer" className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-green-50 text-green-700 rounded-lg text-[11px] font-semibold active:bg-green-100 transition-colors">
                <MessageCircle size={13} /> WhatsApp
              </a>
            </div>
            {selectedCustomer.address && <p className="text-[13px] text-gray-500 mb-3">{selectedCustomer.address}</p>}
            <div className="grid grid-cols-3 gap-1.5">
              <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{selectedCustomer.totalOrders}</p>
                <p className="text-[9px] text-gray-500 font-medium">{t.customer.totalOrders}</p>
              </div>
              <div className="text-center p-2.5 bg-emerald-50 rounded-lg">
                <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(selectedCustomer.totalSpent)}</p>
                <p className="text-[9px] text-emerald-600 font-medium">{t.customer.totalSpent}</p>
              </div>
              <div className="text-center p-2.5 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-600 tabular-nums">{formatCurrency(selectedCustomer.totalDue)}</p>
                <p className="text-[9px] text-red-500 font-medium">{t.customer.totalDue}</p>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="animate-slideUp">
            <h3 className="text-sm font-bold text-gray-800 mb-3">{t.customer.orderHistory}</h3>
            {customerOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100/60 shadow-xs p-6 text-center">
                <p className="text-sm text-gray-400">{t.common.noData}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {customerOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => { setSelectedCustomer(null); navigate(`/orders/${order.id}`); }}
                    className="w-full bg-white rounded-2xl border border-gray-100/60 shadow-xs p-5 text-left active:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatRelativeDate(order.createdAt)}</p>
                    </div>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(order.totalAmount)}</p>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={t.customer.title} />
      <div className="px-4 py-3 space-y-2.5">
        <SearchBar value={search} onChange={setSearch} placeholder={t.customer.search} />

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title={t.customer.noCustomers} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100/60 shadow-xs overflow-hidden divide-y divide-gray-100/80">
            {filtered.map((customer) => {
              const config = reliabilityConfig[customer.reliabilityScore];
              return (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className="w-full px-5 py-4 text-left active:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <div className={`w-8 h-8 rounded-lg ${avatarColors[(customer.id || 0) % avatarColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {getInitials(customer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{customer.name}</p>
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${config.bg} ${config.text}`}>
                        <div className={`w-1 h-1 rounded-full ${config.dot}`} />
                        {t.customer[customer.reliabilityScore === 'new' ? 'newCustomer' : customer.reliabilityScore]}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">{customer.phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[13px] font-bold tabular-nums">{formatCurrency(customer.totalSpent)}</p>
                    <p className="text-[10px] text-gray-400">{customer.totalOrders} অর্ডার</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
