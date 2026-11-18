import { ReactNode, useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PackageCheck,
  RotateCcw,
  Search,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { DEMO_IMAGES } from '../data/seedData';
import { ActiveScreen, DateRangeDays, Product, PurchaseOrder, UserSession } from '../types/inventory';
import { getStockStatus } from '../utils/inventoryEngine';
import { SafeImage } from './SafeImage';

interface AppShellProps {
  activeScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  session: UserSession;
  onSignOut: () => void;
  onResetDemoData: () => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  dateRange: DateRangeDays;
  onDateRangeChange: (d: DateRangeDays) => void;
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  onOpenChat: () => void;
  children: ReactNode;
}

const NAV_ITEMS: { id: ActiveScreen; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Sparkles },
];

export function AppShell({
  activeScreen,
  onNavigate,
  session,
  onSignOut,
  onResetDemoData,
  globalSearch,
  onGlobalSearchChange,
  dateRange,
  onDateRangeChange,
  products,
  purchaseOrders,
  onOpenChat,
  children,
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const lowStockAlerts = products.filter(
    (p) => getStockStatus(p.quantity, p.reorderPoint) !== 'in_stock'
  );
  const openDeliveries = purchaseOrders.filter((po) => po.status !== 'Received');
  const alertCount = lowStockAlerts.length + openDeliveries.length;

  const handleNavClick = (screen: ActiveScreen) => {
    onNavigate(screen);
    setMobileMenuOpen(false);
  };

  const renderNavLinks = () => (
    <nav aria-label="Main navigation" className="space-y-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleNavClick(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'bg-orange-50 text-orange-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon
                className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </span>
            {item.id === 'products' && lowStockAlerts.length > 0 && (
              <span className="font-mono tabular-nums text-xs text-amber-700 font-semibold">
                {lowStockAlerts.length}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30">
        <div className="h-16 px-5 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shrink-0">
            <PackageCheck className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-display text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
            SmartStock AI
          </span>
        </div>

        <div className="flex-1 px-3.5 py-5 overflow-y-auto flex flex-col justify-between gap-6">
          {renderNavLinks()}

          <div className="space-y-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenChat}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <span>Stock Assistant</span>
            </button>

            <div className="px-2 py-1 text-xs text-slate-500 space-y-1">
              <p className="font-medium text-slate-700">Demo Mode · Sample Data</p>
              <p className="leading-relaxed">
                Stored locally in browser. No live database connected.
              </p>
              <button
                type="button"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-700 pt-1"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Reset sample data</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full border-r border-slate-200 p-4 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
                    <PackageCheck className="w-4 h-4 text-white" aria-hidden="true" />
                  </div>
                  <span className="font-display text-base font-bold text-slate-900">
                    SmartStock AI
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 text-slate-500 hover:text-slate-900 rounded-lg"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              {renderNavLinks()}
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenChat();
                }}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-orange-400" aria-hidden="true" />
                <span>Ask Stock Assistant</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onResetDemoData();
                }}
                className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Reset sample data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Global Search */}
            <div className="relative flex-1 max-w-md">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Global catalog search"
                value={globalSearch}
                onChange={(e) => {
                  onGlobalSearchChange(e.target.value);
                  if (e.target.value.trim() && activeScreen !== 'products') {
                    onNavigate('products');
                  }
                }}
                placeholder="Search products or SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 transition-colors"
              />
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Date Filter */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white">
              <Calendar className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <select
                aria-label="Global date range"
                value={dateRange}
                onChange={(e) => onDateRangeChange(Number(e.target.value) as DateRangeDays)}
                className="text-xs font-medium text-slate-700 bg-transparent focus:outline-none cursor-pointer"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label={`Notifications (${alertCount} active alerts)`}
                aria-expanded={notifOpen}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-600 text-white text-[10px] font-mono font-bold flex items-center justify-center">
                    {alertCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div
                  role="region"
                  aria-label="Inventory alerts"
                  className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-40"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">Active Stock & Order Alerts</p>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      aria-label="Close notifications"
                      className="text-xs text-slate-400 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <div className="mt-2.5 space-y-2.5 max-h-72 overflow-y-auto text-xs">
                    {lowStockAlerts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigate('products');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors block"
                      >
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-amber-700 mt-0.5 font-mono tabular-nums">
                          {item.quantity} on hand (reorder at {item.reorderPoint})
                        </p>
                      </button>
                    ))}
                    {openDeliveries.map((po) => (
                      <button
                        key={po.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigate('suppliers');
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-50 transition-colors block"
                      >
                        <p className="font-semibold text-slate-900">
                          {po.poNumber} · {po.status}
                        </p>
                        <p className="text-slate-600 mt-0.5">
                          {po.productName} (+{po.quantity} units · ETA {po.expectedDate})
                        </p>
                      </button>
                    ))}
                    {alertCount === 0 && (
                      <p className="text-slate-500 py-4 text-center">No active alerts.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                aria-label="Account menu"
                aria-expanded={profileOpen}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <SafeImage
                  src={DEMO_IMAGES.avatar}
                  alt={session.name}
                  fallbackLabel={session.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden md:block text-left leading-tight">
                  <p className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                    {session.name}
                  </p>
                  <p className="text-[11px] text-slate-500 whitespace-nowrap">{session.role}</p>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-40">
                  <div className="pb-2.5 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{session.name}</p>
                    <p className="text-xs text-slate-500 truncate">{session.email}</p>
                    <p className="text-[11px] text-orange-600 mt-1 font-medium">
                      Local Demo Session
                    </p>
                  </div>
                  <div className="pt-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onResetDemoData();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reset Sample Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
