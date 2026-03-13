import { useNavigate } from 'react-router-dom';
import { Package, BarChart3, Wallet, Settings, CreditCard, ChevronRight, Send, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import { useTranslation } from '../i18n';
import { useAuthStore } from '../store/useAuthStore';

interface MenuItem {
  path: string;
  icon: typeof Package;
  labelKey: string;
  color: string;
  bg: string;
  desc: string;
  adminOnly?: boolean;
}

const menuItems: MenuItem[] = [
  { path: '/products', icon: Package, labelKey: 'products', color: 'text-purple-600', bg: 'bg-purple-50', desc: 'পণ্য যোগ ও স্টক ম্যানেজ' },
  { path: '/reports', icon: BarChart3, labelKey: 'reports', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'বিক্রি ও আয়ের রিপোর্ট' },
  { path: '/payments', icon: Wallet, labelKey: 'payments', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'পেমেন্ট ও বকেয়া ট্র্যাক' },
  { path: '/request-activation', icon: Send, labelKey: 'requestActivation', color: 'text-orange-600', bg: 'bg-orange-50', desc: 'অ্যাক্টিভেশন রিকোয়েস্ট পাঠান' },
  { path: '/activation', icon: CreditCard, labelKey: 'activation', color: 'text-amber-600', bg: 'bg-amber-50', desc: 'প্ল্যান আপগ্রেড করুন' },
  { path: '/admin', icon: ShieldCheck, labelKey: 'admin', color: 'text-red-600', bg: 'bg-red-50', desc: 'অ্যাডমিন প্যানেল', adminOnly: true },
  { path: '/settings', icon: Settings, labelKey: 'settings', color: 'text-gray-600', bg: 'bg-gray-100', desc: 'ব্যবসার তথ্য ও সেটিংস' },
];

export default function MoreMenu() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAdmin } = useAuthStore();

  const labelMap: Record<string, string> = {
    products: t.nav.products,
    reports: t.nav.reports,
    payments: t.nav.payments,
    requestActivation: t.requestActivation.title,
    activation: t.settings.activation,
    admin: t.admin.title,
    settings: t.nav.settings,
  };

  const visibleItems = menuItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div>
      <Header title={t.nav.more} />
      <div className="px-4 py-3">
        <div className="bg-white rounded-xl border border-gray-100/60 shadow-xs overflow-hidden divide-y divide-gray-100/80">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-5 py-4 active:bg-gray-50 transition-colors"
              >
                <div className={`p-2 rounded-lg ${item.bg}`}>
                  <Icon size={18} className={item.color} />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[13px] font-semibold text-gray-800 block">{labelMap[item.labelKey]}</span>
                  <span className="text-[10px] text-gray-400">{item.desc}</span>
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white font-bold text-sm mx-auto mb-2 shadow-md">
            অ
          </div>
          <p className="text-xs font-semibold text-gray-500">{t.app.name} v1.0.0</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{t.app.tagline}</p>
        </div>
      </div>
    </div>
  );
}
