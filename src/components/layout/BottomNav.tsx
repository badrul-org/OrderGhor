import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, Plus, Users, Menu } from 'lucide-react';
import { useTranslation } from '../../i18n';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { path: '/orders', icon: ShoppingBag, labelKey: 'orders' as const },
  { path: '/new-order', icon: Plus, labelKey: 'newOrder' as const, isFab: true },
  { path: '/customers', icon: Users, labelKey: 'customers' as const },
  { path: '/more', icon: Menu, labelKey: 'more' as const },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pb-safe">
      <div className="mx-3 mb-3">
        <div className="glass rounded-2xl border border-white/70 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-around h-[62px] max-w-lg mx-auto px-1">
            {navItems.map((item) => {
              const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
              const Icon = item.icon;

              if (item.isFab) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex items-center justify-center w-12 h-12 -mt-4 rounded-[16px] gradient-primary text-white shadow-fab hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                  >
                    <Icon size={24} strokeWidth={2.5} />
                  </button>
                );
              }

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-[2px] flex-1 h-full transition-all duration-200 relative ${
                    isActive ? 'text-primary' : 'text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.3 : 1.7} />
                  <span className={`text-[10px] leading-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {t.nav[item.labelKey]}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-0 w-6 h-[3px] bg-primary rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
