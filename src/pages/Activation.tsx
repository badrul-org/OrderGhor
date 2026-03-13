import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Star, Crown, Zap, ArrowLeft, Loader2, WifiOff, Send } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
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
  const { user } = useAuthStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const handleActivate = async () => {
    setError('');
    setIsOffline(false);
    setIsLoading(true);
    try {
      const result = await activateCode(code.trim().toUpperCase());
      if (result.success) {
        showToast('success', t.settings.activated);
        navigate('/');
      } else {
        setError(result.error || t.settings.invalidCode);
        setIsOffline(!!result.offline);
      }
    } catch {
      setError(t.settings.invalidCode);
    } finally {
      setIsLoading(false);
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
                {/* Buy / Request Button */}
                {user ? (
                  <button
                    onClick={() => navigate(`/request-activation?plan=${plan.id}`)}
                    className={`w-full mt-3 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform ${
                      plan.recommended
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Send size={14} />
                    রিকোয়েস্ট পাঠান
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full mt-3 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-2 active:scale-[0.97] transition-transform ${
                      plan.recommended
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    লগইন করে কিনুন
                  </button>
                )}
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
          {error && (
            <div className="flex items-center justify-center gap-2 text-xs text-amber-300">
              {isOffline && <WifiOff size={14} />}
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleActivate}
            disabled={!code.trim() || isLoading}
            className="w-full h-12 bg-amber-400 text-amber-900 rounded-xl text-sm font-bold active:bg-amber-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                যাচাই হচ্ছে...
              </>
            ) : (
              t.settings.activate
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
