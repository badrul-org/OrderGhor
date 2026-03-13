import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, ArrowLeft } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';
import { showToast } from '../components/shared/Toast';

const plans = [
  {
    id: 'starter' as const,
    icon: Zap,
    features: ['অসীম অর্ডার', 'গ্রাহক ডেটাবেস', 'বেসিক রিপোর্ট'],
  },
  {
    id: 'pro' as const,
    icon: Star,
    recommended: true,
    features: ['সব স্টার্টার ফিচার', 'অ্যাডভান্সড রিপোর্ট', 'PDF এক্সপোর্ট', 'পণ্য ক্যাটালগ'],
  },
  {
    id: 'business' as const,
    icon: Crown,
    features: ['সব প্রো ফিচার', 'মাল্টি-ডিভাইস সিঙ্ক', 'কর্মচারী অ্যাক্সেস', 'প্রায়োরিটি সাপোর্ট'],
  },
];

export default function Activation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, activateCode } = useSettingsStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setError('');
    const success = await activateCode(code.trim().toUpperCase());
    if (success) {
      showToast('success', t.settings.activated);
      navigate('/');
    } else {
      setError(t.settings.invalidCode);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-dark text-white">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <button onClick={() => navigate(-1)} className="p-1 mb-4 active:opacity-70">
          <ArrowLeft size={22} />
        </button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{t.activation.title}</h1>
          <p className="text-sm opacity-80">{t.activation.trialEndedDesc}</p>
          {settings?.licenseType === 'trial' && (
            <p className="text-xs mt-2 bg-white/10 inline-block px-3 py-1 rounded-full">
              {t.settings.trialRemaining} {Math.max(0, (settings?.trialMaxOrders || 10) - (settings?.trialOrdersUsed || 0))} {t.settings.ordersRemaining}
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="space-y-3 mb-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const nameKey = `${plan.id}Name` as keyof typeof t.activation;
            const priceKey = `${plan.id}Price` as keyof typeof t.activation;
            const descKey = `${plan.id}Desc` as keyof typeof t.activation;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl p-4 ${plan.recommended ? 'ring-2 ring-amber-400' : ''}`}
              >
                {plan.recommended && (
                  <div className="text-center mb-2">
                    <span className="bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">রিকমেন্ডেড</span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{t.activation[nameKey] as string}</h3>
                    <p className="text-xs text-gray-500">{t.activation[descKey] as string}</p>
                  </div>
                  <div className="ml-auto">
                    <p className="text-xl font-bold text-primary">{t.activation[priceKey] as string}</p>
                    <p className="text-[10px] text-gray-400 text-right">একবার</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <Check size={14} className="text-emerald-500 flex-shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* How to Buy */}
        <div className="bg-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3">{t.activation.howToBuy}</h3>
          <div className="space-y-2 text-xs opacity-90">
            <p>{t.activation.step1}</p>
            <p>{t.activation.step2}</p>
            <p>{t.activation.step3}</p>
            <p>{t.activation.step4}</p>
          </div>
        </div>

        {/* Activation Code Input */}
        <div className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t.settings.enterCode}
            className="w-full h-12 px-4 bg-white text-gray-900 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {error && <p className="text-xs text-amber-300 text-center">{error}</p>}
          <button
            onClick={handleActivate}
            disabled={!code.trim()}
            className="w-full h-12 bg-amber-400 text-amber-900 rounded-xl text-sm font-bold active:bg-amber-500 disabled:opacity-50"
          >
            {t.settings.activate}
          </button>
        </div>
      </div>
    </div>
  );
}
