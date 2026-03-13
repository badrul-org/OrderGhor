import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, Columns3, ChevronRight } from 'lucide-react';
import Header from '../components/layout/Header';
import SearchBar from '../components/shared/SearchBar';
import EmptyState from '../components/shared/EmptyState';
import OrderStatusBadge from '../components/shared/OrderStatusBadge';
import PaymentBadge from '../components/shared/PaymentBadge';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency, formatRelativeDate } from '../utils/format';
import { ORDER_STATUSES, STATUS_COLORS } from '../utils/constants';
import type { OrderStatus, Order } from '../types';
import { ShoppingBag } from 'lucide-react';

type ViewMode = 'list' | 'kanban';

export default function Orders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { orders, loadOrders } = useOrderStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') result = result.filter((o) => o.orderStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, search]);

  const kanbanStatuses: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'delivered'];

  return (
    <div>
      <Header
        title={t.order.title}
        rightAction={
          <div className="flex items-center gap-0.5 bg-slate-100/80 border border-slate-200/60 rounded-lg p-0.5">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              <List size={16} />
            </button>
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
              <Columns3 size={16} />
            </button>
          </div>
        }
      />

      <div className="px-4 py-3 space-y-2.5">
        <SearchBar value={search} onChange={setSearch} placeholder={t.order.search} />

        {/* Status filter */}
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1 -mx-4 px-4">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
              statusFilter === 'all' ? 'gradient-primary text-white shadow-sm' : 'surface-card-soft text-slate-600'
            }`}
          >
            {t.common.all} ({orders.length})
          </button>
          {ORDER_STATUSES.filter((s) => s !== 'cancelled').map((s) => {
            const count = orders.filter((o) => o.orderStatus === s).length;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 ${
                  statusFilter === s ? 'gradient-primary text-white shadow-sm' : 'surface-card-soft text-slate-600'
                }`}
              >
                {t.status[s]} ({count})
              </button>
            );
          })}
        </div>

        {viewMode === 'list' ? (
          filtered.length === 0 ? (
            <EmptyState icon={ShoppingBag} title={t.order.noOrders} description={t.order.noOrdersDesc} />
          ) : (
            <div className="surface-card rounded-xl overflow-hidden divide-y divide-gray-100/80">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
              ))}
            </div>
          )
        ) : (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4">
            {kanbanStatuses.map((status) => {
              const statusOrders = orders.filter((o) => o.orderStatus === status);
              const total = statusOrders.reduce((s, o) => s + o.totalAmount, 0);
              return (
                <div key={status} className="min-w-[270px] flex-shrink-0">
                  <div className="flex items-center justify-between mb-2.5 px-0.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                      <span className="text-sm font-bold text-gray-800">{t.status[status]}</span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-md">{statusOrders.length}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500 tabular-nums">{formatCurrency(total)}</span>
                  </div>
                  <div className="space-y-2">
                    {statusOrders.map((order) => (
                      <KanbanCard key={order.id} order={order} onClick={() => navigate(`/orders/${order.id}`)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/new-order')}
        className="fixed bottom-28 right-4 lg:bottom-6 w-14 h-14 gradient-primary text-white rounded-2xl shadow-fab flex items-center justify-center active:scale-95 transition-all z-30"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}

function OrderCard({ order, onClick }: { order: Order; onClick: () => void }) {
  const itemsSummary = order.items.map((i) => `${i.productName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ');

  return (
    <button onClick={onClick} className="w-full px-5 py-4 text-left active:bg-gray-50 transition-all flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</span>
          <OrderStatusBadge status={order.orderStatus} />
        </div>
        <p className="text-[13px] font-semibold text-gray-900 truncate">{order.customerName}</p>
        <p className="text-[11px] text-gray-400 truncate">{itemsSummary}</p>
        <p className="text-[10px] text-gray-400">{formatRelativeDate(order.createdAt)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[13px] font-bold text-gray-900 tabular-nums">{formatCurrency(order.totalAmount)}</p>
        <div className="mt-0.5"><PaymentBadge status={order.paymentStatus} /></div>
      </div>
      <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

function KanbanCard({ order, onClick }: { order: Order; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full surface-card rounded-xl p-5 text-left active:bg-gray-50 card-hover">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-gray-400 font-mono">{order.orderNumber}</span>
        <PaymentBadge status={order.paymentStatus} />
      </div>
      <p className="text-sm font-semibold text-gray-900 truncate">{order.customerName}</p>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-gray-400">{formatRelativeDate(order.createdAt)}</p>
        <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(order.totalAmount)}</p>
      </div>
    </button>
  );
}
