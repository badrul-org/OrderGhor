import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Minus, Trash2, Facebook, MessageCircle, Phone, Instagram, Globe, Send,
  User, ShoppingBag, Truck, CreditCard, FileText,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useTranslation } from '../i18n';
import { useOrderStore } from '../store/useOrderStore';
import { useCustomerStore } from '../store/useCustomerStore';
import { useProductStore } from '../store/useProductStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { showToast } from '../components/shared/Toast';
import { generateOrderNumber } from '../utils/parseOrder';
import { formatCurrency } from '../utils/format';
import { DELIVERY_AREAS, DELIVERY_PROVIDERS } from '../utils/constants';
import type { OrderItem, PaymentMethod, PaymentStatus, OrderSource, Customer } from '../types';

const sourceIcons: Record<OrderSource, typeof Facebook> = {
  facebook: Facebook, messenger: MessageCircle, whatsapp: Send,
  instagram: Instagram, phone: Phone, other: Globe,
};

const sourceLabels: Record<OrderSource, string> = {
  facebook: 'FB', messenger: 'Msg', whatsapp: 'WA',
  instagram: 'Insta', phone: 'Phone', other: 'Other',
};

const paymentMethods: { id: PaymentMethod; label: string; color: string }[] = [
  { id: 'bkash', label: 'বিকাশ', color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { id: 'nagad', label: 'নগদ', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { id: 'rocket', label: 'রকেট', color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { id: 'cod', label: 'COD', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { id: 'bank', label: 'ব্যাংক', color: 'bg-gray-50 border-gray-200 text-gray-700' },
  { id: 'other', label: 'অন্য', color: 'bg-gray-50 border-gray-200 text-gray-700' },
];

function emptyItem(): OrderItem {
  return { productName: '', variant: '', quantity: 1, unitPrice: 0, totalPrice: 0 };
}

const inputClass = "w-full h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all";
const selectClass = "h-10 px-3 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all";

export default function NewOrder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addOrder } = useOrderStore();
  const { getOrCreateCustomer, customers, loadCustomers } = useCustomerStore();
  const { products, loadProducts } = useProductStore();
  const { settings, canCreateOrder, incrementTrialUsage } = useSettingsStore();

  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<OrderItem[]>([emptyItem()]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('dhaka');
  const [deliveryProvider, setDeliveryProvider] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(settings?.defaultDeliveryCharge || 60);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState<OrderSource>('messenger');
  const [saving, setSaving] = useState(false);
  const [phoneSuggestions, setPhoneSuggestions] = useState<Customer[]>([]);
  const [productSuggestions, setProductSuggestions] = useState<{ idx: number; list: typeof products }>({ idx: -1, list: [] });

  useEffect(() => { loadCustomers(); loadProducts(); }, [loadCustomers, loadProducts]);

  useEffect(() => {
    if (phone.length >= 4 && !matchedCustomer) {
      const cleaned = phone.replace(/\D/g, '');
      const matches = customers.filter((c) => c.phone.includes(cleaned)).slice(0, 5);
      setPhoneSuggestions(matches);
    } else {
      setPhoneSuggestions([]);
    }
  }, [phone, customers, matchedCustomer]);

  const selectCustomer = (c: Customer) => {
    setMatchedCustomer(c);
    setPhone(c.phone);
    setCustomerName(c.name);
    setDeliveryAddress(c.address);
    setDeliveryArea(c.area || 'dhaka');
    setPhoneSuggestions([]);
  };

  const clearCustomer = () => {
    setMatchedCustomer(null);
    setCustomerName('');
    setDeliveryAddress('');
  };

  useEffect(() => {
    const area = DELIVERY_AREAS.find((a) => a.id === deliveryArea);
    if (area) setDeliveryCharge(area.charge);
  }, [deliveryArea]);

  const subtotal = items.reduce((s, item) => s + item.totalPrice, 0);
  const totalAmount = subtotal + deliveryCharge - discount;

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        item.totalPrice = item.quantity * item.unitPrice;
      }
      updated[index] = item;
      return updated;
    });
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductNameChange = (index: number, value: string) => {
    updateItem(index, 'productName', value);
    if (value.length >= 2) {
      const matches = products.filter((p) =>
        p.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setProductSuggestions({ idx: index, list: matches });
    } else {
      setProductSuggestions({ idx: -1, list: [] });
    }
  };

  const selectProduct = (index: number, product: typeof products[0]) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        productName: product.name,
        unitPrice: product.sellPrice,
        totalPrice: updated[index].quantity * product.sellPrice,
      };
      return updated;
    });
    setProductSuggestions({ idx: -1, list: [] });
  };

  const handleSave = async () => {
    if (!phone || !customerName || items.every((i) => !i.productName)) {
      showToast('error', 'নাম, ফোন ও পণ্যের তথ্য দিন');
      return;
    }

    if (!canCreateOrder()) {
      navigate('/activation');
      return;
    }

    setSaving(true);
    try {
      const customerId = await getOrCreateCustomer(customerName, phone, deliveryAddress, deliveryArea, source);
      const orderNumber = await generateOrderNumber();
      const now = new Date();

      const effectivePaidAmount = paymentStatus === 'paid' ? totalAmount : paymentStatus === 'partial' ? paidAmount : 0;

      await addOrder({
        orderNumber,
        customerId,
        customerName,
        customerPhone: phone.replace(/\D/g, ''),
        items: items.filter((i) => i.productName),
        subtotal,
        deliveryCharge,
        discount,
        totalAmount,
        paymentMethod,
        paymentStatus,
        paidAmount: effectivePaidAmount,
        orderStatus: 'new',
        deliveryAddress,
        deliveryArea,
        deliveryProvider,
        trackingNumber: '',
        notes,
        source,
        createdAt: now,
        updatedAt: now,
      });

      await incrementTrialUsage();
      showToast('success', 'অর্ডার সেভ হয়েছে!');
      navigate('/orders');
    } catch {
      showToast('error', 'অর্ডার সেভ করতে সমস্যা হয়েছে');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Header title={t.nav.newOrder} showBack />
      <div className="px-4 py-3 space-y-3">
        {/* Customer Section */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-blue-50/80 rounded-lg">
              <User size={14} className="text-blue-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.order.customerName}</h3>
          </div>
          <div className="space-y-2.5">
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); if (matchedCustomer) clearCustomer(); }}
                placeholder={t.order.phone}
                className={inputClass}
              />
              {phoneSuggestions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto animate-scaleIn">
                  {phoneSuggestions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="text-gray-500 ml-2">{c.phone}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t.order.customerName}
              className={inputClass}
            />
            {matchedCustomer && (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <p className="text-xs text-emerald-700 font-medium">
                  পরিচিত গ্রাহক — মোট {matchedCustomer.totalOrders} টি অর্ডার
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Products Section */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-purple-50/80 rounded-lg">
              <ShoppingBag size={14} className="text-purple-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.order.product}</h3>
          </div>
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className={`space-y-2.5 ${idx < items.length - 1 ? 'pb-4 border-b border-gray-100' : ''}`}>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={item.productName}
                      onChange={(e) => handleProductNameChange(idx, e.target.value)}
                      placeholder={t.order.productName}
                      className="w-full h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all"
                    />
                    {productSuggestions.idx === idx && productSuggestions.list.length > 0 && (
                      <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-36 overflow-y-auto animate-scaleIn">
                        {productSuggestions.list.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => selectProduct(idx, p)}
                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0 flex justify-between"
                          >
                            <span className="font-medium">{p.name}</span>
                            <span className="text-primary font-semibold tabular-nums">{formatCurrency(p.sellPrice)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(idx)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={item.variant}
                  onChange={(e) => updateItem(idx, 'variant', e.target.value)}
                  placeholder={t.order.variant}
                  className={inputClass}
                />
                <div className="flex gap-2">
                  <div className="flex items-center bg-white border border-gray-200/80 rounded-lg overflow-hidden">
                    <button onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))} className="p-2.5 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                      <Minus size={15} />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 h-10 text-center text-sm font-semibold bg-transparent border-0 focus:outline-none"
                    />
                    <button onClick={() => updateItem(idx, 'quantity', item.quantity + 1)} className="p-2.5 hover:bg-gray-200 active:bg-gray-300 transition-colors">
                      <Plus size={15} />
                    </button>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)}
                    placeholder={t.order.unitPrice}
                    className="flex-1 h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all"
                  />
                  <div className="flex items-center h-10 px-3.5 bg-primary-50 border border-primary-100 rounded-lg text-sm font-bold text-primary tabular-nums min-w-[85px] justify-end">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addItem} className="w-full h-10 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 font-medium active:bg-gray-50 flex items-center justify-center gap-1.5 hover:border-primary/40 hover:text-primary transition-colors">
              <Plus size={16} /> {t.order.addItem}
            </button>
          </div>
        </section>

        {/* Delivery Section */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-cyan-50/80 rounded-lg">
              <Truck size={14} className="text-cyan-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.order.deliveryAddress}</h3>
          </div>
          <div className="space-y-2.5">
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder={t.order.deliveryAddress}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none transition-all resize-none"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <select value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)} className={selectClass}>
                {DELIVERY_AREAS.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <select value={deliveryProvider} onChange={(e) => setDeliveryProvider(e.target.value)} className={selectClass}>
                <option value="">{t.order.deliveryProvider}</option>
                {DELIVERY_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">{t.order.deliveryCharge}</label>
              <input
                type="number"
                inputMode="numeric"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Payment Section */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-emerald-50/80 rounded-lg">
              <CreditCard size={14} className="text-emerald-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.payment.method}</h3>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {paymentMethods.map((m) => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${
                  paymentMethod === m.id ? 'gradient-primary text-white border-primary shadow-sm scale-[1.02]' : m.color
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1.5 block">{t.payment.status}</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['paid', 'unpaid', 'partial', 'cod_pending'] as PaymentStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPaymentStatus(s)}
                    className={`py-2 rounded-lg text-[11px] font-semibold border transition-all ${
                      paymentStatus === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {t.payment[s]}
                  </button>
                ))}
              </div>
            </div>
            {paymentStatus === 'partial' && (
              <input
                type="number"
                inputMode="numeric"
                value={paidAmount || ''}
                onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                placeholder={t.payment.paidAmount}
                className={inputClass}
              />
            )}
            <div>
              <label className="text-xs text-gray-500 font-medium mb-1 block">{t.order.discount}</label>
              <input
                type="number"
                inputMode="numeric"
                value={discount || ''}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Summary */}
        <section className="bg-primary-50/50 rounded-xl p-6 shadow-xs border border-primary-100">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">{t.order.subtotal}</span><span className="tabular-nums font-medium">{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">{t.order.deliveryCharge}</span><span className="tabular-nums font-medium">{formatCurrency(deliveryCharge)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span className="text-gray-500">{t.order.discount}</span><span className="tabular-nums text-red-500 font-medium">-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between pt-3 mt-1 border-t-2 border-dashed border-gray-200">
              <span className="font-bold text-base text-gray-900">{t.order.totalAmount}</span>
              <span className="font-bold text-xl text-primary tabular-nums">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </section>

        {/* Notes & Source */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-amber-50/80 rounded-lg">
              <FileText size={14} className="text-amber-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.order.notes}</h3>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.order.notes}
            rows={2}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200/80 rounded-xl text-sm focus:outline-none transition-all resize-none"
          />
          <div>
            <label className="text-xs text-gray-500 font-medium mb-2 block">{t.order.source}</label>
            <div className="flex gap-1.5">
              {(Object.keys(sourceIcons) as OrderSource[]).map((s) => {
                const Icon = sourceIcons[s];
                return (
                  <button
                    key={s}
                    onClick={() => setSource(s)}
                    className={`flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border-2 text-[10px] font-semibold transition-all flex-1 ${
                      source === s ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-500 border-gray-200'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{sourceLabels[s]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 gradient-primary text-white rounded-xl text-sm font-bold active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-fab btn-press"
        >
          {saving ? t.common.loading : `${t.order.saveOrder} ✓`}
        </button>

        <div className="h-2" />
      </div>
    </div>
  );
}
