import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingBag, PlusCircle, Users, Package, BarChart3,
  Wallet, Settings,
} from 'lucide-react';
import { useTranslation } from '../../i18n';

const sidebarItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' as const },
  { path: '/orders', icon: ShoppingBag, labelKey: 'orders' as const },
  { path: '/new-order', icon: PlusCircle, labelKey: 'newOrder' as const, highlight: true },
  { path: '/customers', icon: Users, labelKey: 'customers' as const },
  { path: '/products', icon: Package, labelKey: 'products' as const },
  { path: '/reports', icon: BarChart3, labelKey: 'reports' as const },
  { path: '/payments', icon: Wallet, labelKey: 'payments' as const },
  { path: '/settings', icon: Settings, labelKey: 'settings' as const },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex flex-col w-[220px] bg-slate-50 border-r border-slate-200/80 h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-2">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/30">
          অ
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 tracking-tight">{t.app.name}</h1>
          <p className="text-[9px] text-slate-400 -mt-0.5 tracking-wider">ORDER MANAGEMENT</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2.5 overflow-y-auto">
        <div className="space-y-0.5">
          {sidebarItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            const Icon = item.icon;

            if (item.highlight) {
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-3 w-full px-3.5 py-3 my-2 rounded-xl text-[13px] font-semibold gradient-primary text-white shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Icon size={20} />
                  <span>{t.nav[item.labelKey as keyof typeof t.nav]}</span>
                </button>
              );
            }

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50/90 text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-500 hover:bg-white/80 hover:text-slate-800'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
                <span className="flex-1 text-left">{t.nav[item.labelKey as keyof typeof t.nav]}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-200/70">
        <p className="text-[10px] text-slate-400">{t.app.name} v1.0.0</p>
      </div>
    </aside>
  );
}
