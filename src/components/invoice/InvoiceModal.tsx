import { useRef, useState } from 'react';
import { X, Download, ImageDown, MessageCircle, Loader2 } from 'lucide-react';
import InvoicePreview from './InvoicePreview';
import { downloadInvoicePDF, downloadInvoiceImage, shareInvoiceWhatsApp, getInvoiceFilename } from '../../utils/invoiceDownload';
import { showToast } from '../shared/Toast';
import type { Order, AppSettings } from '../../types';

interface InvoiceModalProps {
  order: Order;
  settings: AppSettings;
  onClose: () => void;
}

type Action = 'pdf' | 'image' | 'share' | null;

export default function InvoiceModal({ order, settings, onClose }: InvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<Action>(null);

  const run = async (action: Action, fn: () => Promise<void>) => {
    if (!invoiceRef.current) return;
    setLoading(action);
    try {
      await fn();
      if (action === 'share') showToast('success', 'শেয়ার করা হয়েছে');
      else showToast('success', action === 'pdf' ? 'PDF ডাউনলোড হয়েছে' : 'ছবি ডাউনলোড হয়েছে');
    } catch {
      showToast('error', 'ডাউনলোড করতে সমস্যা হয়েছে');
    } finally {
      setLoading(null);
    }
  };

  const handlePDF = () =>
    run('pdf', () =>
      downloadInvoicePDF(invoiceRef.current!, getInvoiceFilename(order.orderNumber, 'pdf'))
    );

  const handleImage = () =>
    run('image', () =>
      downloadInvoiceImage(invoiceRef.current!, getInvoiceFilename(order.orderNumber, 'png'))
    );

  const handleShare = () =>
    run('share', () =>
      shareInvoiceWhatsApp(invoiceRef.current!, order.customerPhone, order.orderNumber)
    );

  const isLoading = loading !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shrink-0">
        <span className="text-sm font-bold text-gray-900">ইনভয়েস — {order.orderNumber}</span>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Scrollable invoice preview */}
      <div className="flex-1 overflow-auto py-4 px-3">
        <div className="flex justify-center">
          {/* This wrapper is off-screen safe — just centered on screen */}
          <div className="shadow-2xl rounded-lg overflow-hidden">
            <InvoicePreview ref={invoiceRef} order={order} settings={settings} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 shrink-0">
        <div className="flex gap-2.5 max-w-md mx-auto">
          <button
            onClick={handlePDF}
            disabled={isLoading}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-primary text-white rounded-xl text-sm font-bold active:opacity-90 disabled:opacity-50 shadow-md transition-opacity"
          >
            {loading === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            PDF
          </button>
          <button
            onClick={handleImage}
            disabled={isLoading}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-emerald-600 text-white rounded-xl text-sm font-bold active:opacity-90 disabled:opacity-50 shadow-md transition-opacity"
          >
            {loading === 'image' ? <Loader2 size={16} className="animate-spin" /> : <ImageDown size={16} />}
            ছবি
          </button>
          <button
            onClick={handleShare}
            disabled={isLoading}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl text-sm font-bold active:opacity-90 disabled:opacity-50 shadow-md transition-opacity"
          >
            {loading === 'share' ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
