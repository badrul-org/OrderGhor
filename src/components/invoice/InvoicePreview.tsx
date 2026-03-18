import { forwardRef } from 'react';
import type { Order, AppSettings } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';

interface InvoicePreviewProps {
  order: Order;
  settings: AppSettings;
}

// This component renders a clean A5-sized invoice.
// It is rendered off-screen (or in a modal) and captured by html2canvas.
const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(
  ({ order, settings }, ref) => {
    const dueAmount = Math.max(0, order.totalAmount - order.paidAmount);
    const isPaid = order.paymentStatus === 'paid';

    const paymentLabel: Record<string, string> = {
      bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট',
      cod: 'ক্যাশ অন ডেলিভারি', bank: 'ব্যাংক', partial: 'আংশিক', other: 'অন্যান্য',
    };

    return (
      <div
        ref={ref}
        style={{ fontFamily: "'Noto Sans Bengali', sans-serif", width: '560px', background: '#fff', color: '#111' }}
      >
        {/* Header */}
        <div style={{ background: '#1a56db', padding: '24px 28px 20px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' }}>
                {settings.businessName}
              </div>
              {settings.ownerName && (
                <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>{settings.ownerName}</div>
              )}
              {settings.phone && (
                <div style={{ fontSize: '12px', opacity: 0.85 }}>{settings.phone}</div>
              )}
              {settings.address && (
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px', maxWidth: '200px' }}>{settings.address}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>ইনভয়েস</div>
              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>{order.orderNumber}</div>
              <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px' }}>
                তারিখ: {formatDate(order.createdAt)}
              </div>
              {/* Status badge */}
              <div style={{
                display: 'inline-block', marginTop: '6px', padding: '2px 10px',
                borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                background: isPaid ? '#d1fae5' : dueAmount > 0 ? '#fee2e2' : '#fef3c7',
                color: isPaid ? '#065f46' : dueAmount > 0 ? '#991b1b' : '#92400e',
              }}>
                {isPaid ? '✓ পেইড' : dueAmount > 0 ? `বাকি ${formatCurrency(dueAmount)}` : 'COD'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 28px' }}>
          {/* Customer Info */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                গ্রাহকের তথ্য
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>{order.customerName}</div>
              <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px' }}>{order.customerPhone}</div>
              {order.deliveryAddress && (
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', lineHeight: '1.5' }}>
                  {order.deliveryAddress}
                  {order.deliveryArea && `, ${order.deliveryArea}`}
                </div>
              )}
            </div>
            {(order.deliveryProvider || order.trackingNumber) && (
              <div style={{ flex: 1, background: '#f8fafc', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  ডেলিভারি তথ্য
                </div>
                {order.deliveryProvider && (
                  <div style={{ fontSize: '12px', color: '#374151' }}>কোম্পানি: {order.deliveryProvider}</div>
                )}
                {order.trackingNumber && (
                  <div style={{ fontSize: '12px', color: '#374151', marginTop: '2px', fontFamily: 'monospace' }}>
                    ট্র্যাকিং: {order.trackingNumber}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr style={{ background: '#1a56db', color: '#fff' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, borderRadius: '6px 0 0 6px' }}>পণ্য</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 600 }}>পরিমাণ</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600 }}>একক মূল্য</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: '11px', fontWeight: 600, borderRadius: '0 6px 6px 0' }}>মোট</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#111827' }}>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    {item.variant && <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>{item.variant}</div>}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center', fontSize: '12px', color: '#374151' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <div style={{ minWidth: '220px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', color: '#6b7280' }}>
                <span>সাব-টোটাল</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(order.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', color: '#6b7280' }}>
                <span>ডেলিভারি চার্জ</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(order.deliveryCharge)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: '12px', color: '#dc2626' }}>
                  <span>ছাড়</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', marginTop: '4px', background: '#1a56db', borderRadius: '8px', color: '#fff' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>মোট টাকা</span>
                <span style={{ fontSize: '16px', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>পেমেন্ট পদ্ধতি</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{paymentLabel[order.paymentMethod] || order.paymentMethod}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>পরিশোধিত</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#059669' }}>{formatCurrency(order.paidAmount)}</div>
            </div>
            {dueAmount > 0 && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>বাকি</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>{formatCurrency(dueAmount)}</div>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <div style={{ marginTop: '12px', background: '#fffbeb', borderRadius: '8px', padding: '10px 14px', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: '11px', color: '#92400e', fontWeight: 600, marginBottom: '2px' }}>নোট</div>
              <div style={{ fontSize: '12px', color: '#78350f' }}>{order.notes}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e5e7eb', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>
            ধন্যবাদ আপনার কেনাকাটার জন্য 🙏
          </div>
          <div style={{ fontSize: '10px', color: '#9ca3af' }}>
            অর্ডারঘর দ্বারা তৈরি
          </div>
        </div>
      </div>
    );
  }
);

InvoicePreview.displayName = 'InvoicePreview';
export default InvoicePreview;
