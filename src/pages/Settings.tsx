import { useEffect, useState } from 'react';
import { Download, Upload, Trash2, Shield, Globe, Store } from 'lucide-react';
import Header from '../components/layout/Header';
import ConfirmDialog from '../components/shared/ConfirmDialog';
import { showToast } from '../components/shared/Toast';
import { useTranslation } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';
import { db } from '../db/database';

const inputClass = "w-full h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm focus:outline-none transition-all";

export default function Settings() {
  const { t } = useTranslation();
  const { settings, loadSettings, updateSettings, setLanguage, activateCode } = useSettingsStore();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(60);
  const [activationInput, setActivationInput] = useState('');
  const [activationError, setActivationError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName);
      setOwnerName(settings.ownerName);
      setPhone(settings.phone);
      setAddress(settings.address);
      setDefaultDeliveryCharge(settings.defaultDeliveryCharge);
    }
  }, [settings]);

  const handleSave = async () => {
    await updateSettings({ businessName, ownerName, phone, address, defaultDeliveryCharge });
    showToast('success', 'সেটিংস সেভ হয়েছে');
  };

  const handleActivate = async () => {
    setActivationError('');
    const success = await activateCode(activationInput.trim().toUpperCase());
    if (success) {
      showToast('success', t.settings.activated);
      setActivationInput('');
    } else {
      setActivationError(t.settings.invalidCode);
    }
  };

  const handleExport = async () => {
    const data = {
      orders: await db.orders.toArray(),
      customers: await db.customers.toArray(),
      products: await db.products.toArray(),
      expenses: await db.expenses.toArray(),
      settings: await db.settings.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orderghor-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'ডেটা এক্সপোর্ট হয়েছে');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.orders) await db.orders.bulkPut(data.orders);
        if (data.customers) await db.customers.bulkPut(data.customers);
        if (data.products) await db.products.bulkPut(data.products);
        if (data.expenses) await db.expenses.bulkPut(data.expenses);
        showToast('success', 'ডেটা ইমপোর্ট হয়েছে');
      } catch {
        showToast('error', 'ইমপোর্ট করতে সমস্যা হয়েছে');
      }
    };
    input.click();
  };

  const handleClearData = async () => {
    await db.orders.clear();
    await db.customers.clear();
    await db.products.clear();
    await db.expenses.clear();
    await db.dailyLedger.clear();
    setShowClearConfirm(false);
    showToast('success', 'সব ডেটা ডিলিট হয়েছে');
  };

  const licenseLabel = settings?.licenseType === 'trial' ? 'ফ্রি ট্রায়াল' :
    settings?.licenseType === 'starter' ? 'স্টার্টার' :
    settings?.licenseType === 'pro' ? 'প্রো' : 'বিজনেস';

  return (
    <div>
      <Header title={t.settings.title} showBack />
      <div className="px-4 py-3 space-y-3">
        {/* Business Info */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-blue-50 rounded-lg">
              <Store size={15} className="text-blue-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">ব্যবসার তথ্য</h3>
          </div>
          <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder={t.settings.businessName} className={inputClass} />
          <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder={t.settings.ownerName} className={inputClass} />
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.settings.phone} className={inputClass} />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.settings.address} className={inputClass} />
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">{t.settings.defaultDelivery}</label>
            <input type="number" value={defaultDeliveryCharge} onChange={(e) => setDefaultDeliveryCharge(parseInt(e.target.value) || 0)} className={inputClass} />
          </div>
          <button onClick={handleSave} className="w-full h-10 bg-primary text-white rounded-lg text-sm font-bold active:opacity-90 transition-opacity shadow-md">
            {t.common.save}
          </button>
        </section>

        {/* Language */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-purple-50 rounded-lg">
                <Globe size={15} className="text-purple-600" />
              </div>
              <span className="text-[13px] font-bold text-gray-800">{t.settings.language}</span>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              <button onClick={() => setLanguage('bn')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${settings?.language === 'bn' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                বাংলা
              </button>
              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${settings?.language === 'en' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                English
              </button>
            </div>
          </div>
        </section>

        {/* Activation */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-emerald-50 rounded-lg">
              <Shield size={15} className="text-emerald-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.settings.activation}</h3>
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-white rounded-xl p-3.5 border border-gray-100">
            <span className="text-xs text-gray-500 font-medium">বর্তমান প্ল্যান</span>
            <span className="text-sm font-bold text-primary bg-primary-50 px-3 py-1 rounded-lg">{licenseLabel}</span>
          </div>
          {settings?.licenseType === 'trial' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-xl">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <p className="text-xs text-amber-700 font-medium">
                {t.settings.trialRemaining} {settings.trialMaxOrders - settings.trialOrdersUsed} {t.settings.ordersRemaining}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={activationInput}
              onChange={(e) => setActivationInput(e.target.value)}
              placeholder={t.settings.enterCode}
              className="flex-1 h-10 px-3.5 bg-white border border-gray-200/80 rounded-lg text-sm font-mono uppercase focus:outline-none transition-all"
            />
            <button onClick={handleActivate} className="px-4 h-10 bg-primary text-white rounded-lg text-sm font-bold active:opacity-90 transition-opacity shadow-sm">
              {t.settings.activate}
            </button>
          </div>
          {activationError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-xl">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <p className="text-xs text-red-600 font-medium">{activationError}</p>
            </div>
          )}
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-xl p-6 shadow-xs border border-gray-100/60 space-y-2.5">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 bg-gray-100 rounded-lg">
              <Download size={15} className="text-gray-600" />
            </div>
            <h3 className="text-[13px] font-bold text-gray-800">{t.settings.backup}</h3>
          </div>
          <button onClick={handleExport} className="w-full h-10 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold active:bg-emerald-100 border border-emerald-200/60 transition-colors">
            <Download size={16} /> {t.settings.exportData}
          </button>
          <button onClick={handleImport} className="w-full h-10 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold active:bg-blue-100 border border-blue-200/60 transition-colors">
            <Upload size={16} /> {t.settings.importData}
          </button>
          <button onClick={() => setShowClearConfirm(true)} className="w-full h-10 flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-lg text-sm font-semibold active:bg-red-100 border border-red-200/60 transition-colors">
            <Trash2 size={16} /> {t.settings.clearData}
          </button>
        </section>

        {/* About */}
        <div className="text-center py-4">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 shadow-md">
            অ
          </div>
          <p className="text-xs font-semibold text-gray-500">{t.app.name} v1.0.0</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t.app.tagline}</p>
        </div>
      </div>

      <ConfirmDialog
        open={showClearConfirm}
        title={t.settings.clearData}
        message={t.settings.clearConfirm}
        onConfirm={handleClearData}
        onCancel={() => setShowClearConfirm(false)}
        confirmText={t.common.delete}
        danger
      />
    </div>
  );
}
