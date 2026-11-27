import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Package,
  RotateCcw,
  ShoppingCart,
  X,
} from 'lucide-react';
import { NavView } from '../types/store';

interface SidebarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  cartUnits: number;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onResetDemoData: () => void;
}

const NAV_ITEMS: { id: NavView; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
  { id: 'analytics', label: 'Sales Analytics', icon: BarChart3 },
  { id: 'checkout', label: 'Checkout', icon: CreditCard },
];

export function Sidebar({
  activeView,
  onSelectView,
  cartUnits,
  mobileOpen,
  onToggleMobile,
  onResetDemoData,
}: SidebarProps) {
  const handleNav = (view: NavView) => {
    onSelectView(view);
    if (mobileOpen) {
      onToggleMobile();
    }
  };

  const sidebarBody = (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-100 px-4 py-6">
      <div>
        <div className="flex items-center justify-between px-2 pb-5 border-b border-slate-800">
          <div>
            <h1 className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              Discount Engine
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Smart Retail &amp; Billing
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleMobile}
            aria-label="Close navigation"
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-5 space-y-1" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'cart' && (
                  <span className="font-mono text-xs tabular-nums text-slate-200">
                    {cartUnits}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="px-2 text-xs text-slate-400 space-y-2 leading-relaxed">
          <p className="font-semibold text-slate-200">Discount Policy</p>
          <p>
            Auto Slabs: &lt; ₹1k (0%) · ₹1k–2,499 (5%) · ₹2.5k–4,999 (10%) · ₹5k+ (15%)
          </p>
          <p>
            Coupons: SAVE10 (10%) · STUDENT5 (5% Student) · FESTIVE20 (20%)
          </p>
          <p>
            Customer Bonus: Regular +0% · Student +5% · Premium +10% (25% Max Cap)
          </p>
        </div>

        <button
          type="button"
          onClick={onResetDemoData}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-4 bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Open navigation"
          className="p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold tracking-tight whitespace-nowrap">
          E-Commerce Discount Engine
        </span>
        <button
          type="button"
          onClick={() => onSelectView('cart')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold whitespace-nowrap shrink-0"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{cartUnits}</span>
        </button>
      </header>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-800">
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onToggleMobile}
            aria-hidden="true"
          />
          <div className="relative z-50 w-72 max-w-[85vw] h-full shadow-xl">
            {sidebarBody}
          </div>
        </div>
      )}
    </>
  );
}
