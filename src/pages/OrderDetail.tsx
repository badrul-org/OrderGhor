import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageCircle, Edit, Trash2, ChevronDown } from 'lucide-react';
import Header from '../components/layout/Header';
import OrderStatusBadge from '../components/shared/OrderStatusBadge';
import PaymentBadge from '../components/shared/PaymentBadge';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { showToast } from '../components/shared/Toast';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { formatCurrency, formatDateTime } from '../utils/format';
import { getWhatsAppUrl, getOrderConfirmationMessage, getDeliveryUpdateMessage } from '../utils/parseOrder';
import { ORDER_STATUSES, STATUS_COLORS } from '../utils/constants';
import type { OrderStatus, PaymentStatus } from '../types';
import { db } from '../db/database';
import type { Order } from '../types';

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { updateOrderStatus, deleteOrder, updateOrder } = useOrderStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPaymentMenu, setShowPaymentMenu] = useState(false);

  useEffect(() => {
    if (!id) return;
    db.orders.get(parseInt(id)).then((o) => {
      if (o) setOrder(o);
      else navigate('/orders');
    });
  }, [id, navigate]);

  if (!order) return null;

  const handleStatusChange = async (status: OrderStatus) => {
    await updateOrderStatus(order.id!, status);
    setOrder({ ...order, orderStatus: status });
    setShowStatusMenu(false);
    showToast('success', 'স্ট্যাটাস আপডেট হয়েছে');
  };

  const handlePaymentChange = async (status: PaymentStatus) => {
    const paidAmount = status === 'paid' ? order.totalAmount : status === 'unpaid' ? 0 : order.paidAmount;
    await updateOrder(order.id!, { paymentStatus: status, paidAmount });
    setOrder({ ...order, paymentStatus: status, paidAmount });
    setShowPaymentMenu(false);
    showToast('success', 'পেমেন্ট আপডেট হয়েছে');
  };

  const handleDelete = async () => {
    await deleteOrder(order.id!);
    showToast('success', 'অর্ডার ডিলিট হয়েছে');
    navigate('/orders');
  };

  const handleCall = () => {
    window.location.href = `tel:${order.customerPhone}`;
  };

  const handleWhatsApp = () => {
    const items = order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');
    const msg = order.orderStatus === 'shipped'
      ? getDeliveryUpdateMessage(order.customerName, order.orderNumber, order.deliveryProvider, order.trackingNumber)
      : getOrderConfirmationMessage(order.customerName, order.orderNumber, items, order.totalAmount, order.deliveryArea);
    window.open(getWhatsAppUrl(order.customerPhone, msg), '_blank');
  };

  const dueAmount = order.totalAmount - order.paidAmount;

  const statusFlow: OrderStatus[] = ['new', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = statusFlow.indexOf(order.orderStatus);

  return (
    <div>
      <Header title={order.orderNumber} showBack />

      <div className="px-4 py-3 space-y-3">
        {/* Status Timeline */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 animate-slideUp">
          <div className="flex items-center justify-between mb-3 px-1">
            {statusFlow.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i <= currentIdx ? 'text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`} style={i <= currentIdx ? { backgroundColor: STATUS_COLORS[s] } : undefined}>
                  {i + 1}
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1.5 rounded-full ${i < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <OrderStatusBadge status={order.orderStatus} size="md" />
            <div className="relative">
              <button onClick={() => setShowStatusMenu(!showStatusMenu)} className="flex items-center gap-1.5 text-xs text-primary font-semibold px-3.5 py-2 border border-primary/20 rounded-xl hover:bg-primary-50 transition-colors">
                স্ট্যাটাস পরিবর্তন <ChevronDown size={14} />
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-10 animate-scaleIn overflow-hidden">
                  {ORDER_STATUSES.map((s) => (
                    <button key={s} onClick={() => handleStatusChange(s)} className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-2.5 transition-colors">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: STATUS_COLORS[s] }} />
                      {t.status[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <h3 className="text-xs text-gray-500 font-medium mb-2">{t.order.customerName}</h3>
          <p className="text-[15px] font-bold text-gray-900">{order.customerName}</p>
          <p className="text-sm text-gray-600 mt-0.5">{order.customerPhone}</p>
          {order.deliveryAddress && <p className="text-xs text-gray-500 mt-1.5">{order.deliveryAddress}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={handleCall} className="flex-1 h-9 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-semibold active:bg-emerald-100 transition-colors">
              <Phone size={14} /> কল করুন
            </button>
            <button onClick={handleWhatsApp} className="flex-1 h-9 flex items-center justify-center gap-2 bg-green-50 text-green-700 rounded-lg text-xs font-semibold active:bg-green-100 transition-colors">
              <MessageCircle size={14} /> WhatsApp
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <h3 className="text-xs text-gray-500 font-medium mb-2">{t.order.product}</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i < order.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                  {item.variant && <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm tabular-nums text-gray-600">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                  <p className="text-xs font-bold tabular-nums text-gray-900">{formatCurrency(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t.order.subtotal}</span><span className="tabular-nums font-medium">{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t.order.deliveryCharge}</span><span className="tabular-nums font-medium">{formatCurrency(order.deliveryCharge)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">{t.order.discount}</span><span className="tabular-nums text-red-500 font-medium">-{formatCurrency(order.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span>{t.order.totalAmount}</span>
              <span className="text-primary tabular-nums">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs text-gray-500 font-medium">{t.payment.status}</h3>
            <div className="relative">
              <button onClick={() => setShowPaymentMenu(!showPaymentMenu)}>
                <PaymentBadge status={order.paymentStatus} />
              </button>
              {showPaymentMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-lg z-10 animate-scaleIn overflow-hidden">
                  {(['paid', 'unpaid', 'partial', 'cod_pending', 'refunded'] as PaymentStatus[]).map((s) => (
                    <button key={s} onClick={() => handlePaymentChange(s)} className="w-full px-4 py-3 text-left text-xs font-medium hover:bg-gray-50 transition-colors">
                      {t.payment[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">{t.payment.method}</span><span className="font-medium">{t.payment[order.paymentMethod as keyof typeof t.payment] || order.paymentMethod}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t.payment.paidAmount}</span><span className="tabular-nums text-emerald-600 font-semibold">{formatCurrency(order.paidAmount)}</span></div>
            {dueAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">{t.payment.dueAmount}</span><span className="tabular-nums text-red-600 font-bold">{formatCurrency(dueAmount)}</span></div>}
          </div>
        </div>

        {/* Meta */}
        <div className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 text-xs text-gray-500 space-y-2">
          {order.trackingNumber && <div className="flex justify-between"><span>{t.order.trackingNumber}</span><span className="font-mono font-medium text-gray-700">{order.trackingNumber}</span></div>}
          {order.notes && <div className="bg-amber-50 rounded-xl p-3"><span className="font-semibold text-amber-700">{t.order.notes}:</span> <span className="text-amber-800">{order.notes}</span></div>}
          <div className="flex justify-between"><span>তৈরি</span><span className="font-medium">{formatDateTime(order.createdAt)}</span></div>
          <div className="flex justify-between"><span>আপডেট</span><span className="font-medium">{formatDateTime(order.updatedAt)}</span></div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => navigate(`/orders/${order.id}/edit`)} className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-lg text-sm font-bold active:opacity-90 transition-opacity shadow-md">
            <Edit size={16} /> {t.common.edit}
          </button>
          <button onClick={() => setShowDeleteConfirm(true)} className="h-11 px-4 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold active:bg-red-100 border border-red-200/60 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>

        <div className="h-2" />
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={t.order.deleteOrder}
        message={t.order.confirmDelete}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText={t.common.delete}
        danger
      />
    </div>
  );
}
