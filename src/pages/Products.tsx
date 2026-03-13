import { useEffect, useState, useMemo } from 'react';
import { Plus, Minus, Package, X } from 'lucide-react';
import Header from '../components/layout/Header';
import SearchBar from '../components/shared/SearchBar';
import EmptyState from '../components/shared/EmptyState';
import { showToast } from '../components/shared/Toast';
import { useTranslation } from '../i18n';
import { useProductStore } from '../store/useProductStore';
import { formatCurrency } from '../utils/format';
import { PRODUCT_CATEGORIES } from '../utils/constants';
import type { Product } from '../types';

const inputClass = "w-full h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all";

export default function Products() {
  const { t } = useTranslation();
  const { products, loadProducts, addProduct, updateProduct, updateStock } = useProductStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('clothing');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [sku, setSku] = useState('');

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filtered = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setName(product.name);
      setCategory(product.category);
      setBuyPrice(product.buyPrice);
      setSellPrice(product.sellPrice);
      setStock(product.stock);
      setLowStockAlert(product.lowStockAlert);
      setSku(product.sku);
    } else {
      setEditingProduct(null);
      setName(''); setCategory('clothing'); setBuyPrice(0); setSellPrice(0);
      setStock(0); setLowStockAlert(5); setSku('');
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name) { showToast('error', 'পণ্যের নাম দিন'); return; }
    const now = new Date();
    if (editingProduct?.id) {
      await updateProduct(editingProduct.id, { name, category, buyPrice, sellPrice, stock, lowStockAlert, sku });
      showToast('success', 'পণ্য আপডেট হয়েছে');
    } else {
      await addProduct({ name, sku, category, variants: [], buyPrice, sellPrice, stock, lowStockAlert, imageUrl: '', isActive: true, createdAt: now, updatedAt: now });
      showToast('success', 'পণ্য যোগ হয়েছে');
    }
    setShowForm(false);
  };

  return (
    <div>
      <Header title={t.product.title} />
      <div className="px-4 py-3 space-y-2.5">
        <SearchBar value={search} onChange={setSearch} placeholder={t.product.search} />

        {filtered.length === 0 && !showForm ? (
          <EmptyState
            icon={Package}
            title={t.product.noProducts}
            action={
              <button onClick={() => openForm()} className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-transform">
                <Plus size={16} className="inline mr-1.5" /> {t.product.addNew}
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filtered.map((product) => {
              const isLow = product.stock <= product.lowStockAlert;
              const isOut = product.stock === 0;
              return (
                <div key={product.id} className="bg-white border border-gray-100/60 rounded-xl p-5 shadow-xs card-hover">
                  <div className={`w-full h-20 rounded-lg flex items-center justify-center mb-2 ${isOut ? 'bg-red-50' : isLow ? 'bg-amber-50' : 'bg-gray-50'}`}>
                    <Package size={30} className={isOut ? 'text-red-300' : isLow ? 'text-amber-300' : 'text-gray-300'} />
                  </div>
                  <p className="text-[13px] font-semibold text-gray-900 truncate">{product.name}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{PRODUCT_CATEGORIES.find((c) => c.id === product.category)?.name}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(product.sellPrice)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                      isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isOut ? t.product.outOfStock : `${t.product.stock}: ${product.stock}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateStock(product.id!, -1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md active:bg-gray-200 transition-colors">
                        <Minus size={13} />
                      </button>
                      <span className="text-sm font-bold w-8 text-center tabular-nums">{product.stock}</span>
                      <button onClick={() => updateStock(product.id!, 1)} className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded-md active:bg-gray-200 transition-colors">
                        <Plus size={13} />
                      </button>
                    </div>
                    <button onClick={() => openForm(product)} className="text-xs text-primary font-semibold hover:underline">
                      {t.common.edit}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAB */}
        <button
          onClick={() => openForm()}
          className="fixed bottom-24 right-4 lg:bottom-6 w-14 h-14 gradient-primary text-white rounded-2xl shadow-fab flex items-center justify-center active:scale-95 transition-all z-30 hover:shadow-xl"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 animate-fadeIn" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-6 max-h-[85vh] overflow-y-auto animate-slideUp shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">{editingProduct ? t.common.edit : t.product.addNew}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="space-y-2.5">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.product.name} className={inputClass} />
              <input type="text" value={sku} onChange={(e) => setSku(e.target.value)} placeholder={t.product.sku} className={inputClass} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all">
                {PRODUCT_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">{t.product.buyPrice}</label>
                  <input type="number" value={buyPrice || ''} onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">{t.product.sellPrice}</label>
                  <input type="number" value={sellPrice || ''} onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>
              {sellPrice > buyPrice && buyPrice > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  <p className="text-xs text-emerald-700 font-medium">{t.product.profit}: {formatCurrency(sellPrice - buyPrice)} / পিস</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">{t.product.stock}</label>
                  <input type="number" value={stock || ''} onChange={(e) => setStock(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">{t.product.lowStockAlert}</label>
                  <input type="number" value={lowStockAlert || ''} onChange={(e) => setLowStockAlert(parseInt(e.target.value) || 0)} className={inputClass} />
                </div>
              </div>
              <button onClick={handleSave} className="w-full h-10 bg-primary text-white rounded-lg text-sm font-bold active:opacity-90 transition-opacity shadow-md mt-1.5">
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
