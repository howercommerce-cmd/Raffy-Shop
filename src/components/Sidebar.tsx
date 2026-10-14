import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  History,
  Users,
  Truck,
  FileSpreadsheet,
  BarChart3,
  Settings,
  AlertTriangle,
  Store,
  X,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { useShop } from '../context/ShopContext';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { dashboardStats, settings } = useShop();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pos' as ActiveTab,
      label: 'POS / New Bill',
      icon: ShoppingCart,
      highlight: true,
      badge: 'Fast',
    },
    {
      id: 'products' as ActiveTab,
      label: 'Products',
      icon: Package,
      badge: dashboardStats.totalProductsCount > 0 ? String(dashboardStats.totalProductsCount) : null,
    },
    {
      id: 'inventory' as ActiveTab,
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: dashboardStats.lowStockCount > 0 ? `${dashboardStats.lowStockCount} Low` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'sales' as ActiveTab,
      label: 'Sales History',
      icon: History,
      badge: null,
    },
    {
      id: 'customers' as ActiveTab,
      label: 'Customers (Khata)',
      icon: Users,
      badge: null,
    },
    {
      id: 'purchases' as ActiveTab,
      label: 'Purchases (Stock In)',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'Suppliers',
      icon: Truck,
      badge: null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Daily Reports',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Shop Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } no-print`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold text-white tracking-wide truncate">
                {settings.shopName || 'Smart Shop POS'}
              </h2>
              <span className="text-[11px] font-medium text-emerald-400 block leading-tight">
                Physical Retail POS
              </span>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick POS Button in Sidebar */}
        <div className="p-3">
          <button
            onClick={() => handleSelect('pos')}
            className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-emerald-500 text-white shadow-emerald-900/40'
                : 'bg-emerald-600/90 hover:bg-emerald-600 text-white hover:shadow-emerald-900/30'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Open POS Billing</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border-l-4 border-emerald-500 font-bold shadow-xs'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Low Stock Warning Alert in Footer if applicable */}
        {dashboardStats.lowStockCount > 0 && (
          <div className="mx-3 mb-3 p-3 bg-amber-950/40 border border-amber-800/50 rounded-xl text-amber-300 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold block">{dashboardStats.lowStockCount} Items Low in Stock</span>
              <button
                onClick={() => handleSelect('inventory')}
                className="text-[11px] text-amber-200 underline hover:text-white cursor-pointer"
              >
                View inventory
              </button>
            </div>
          </div>
        )}

        {/* Currency & Sync Status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Cloud Live</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold bg-slate-800 px-2 py-0.5 rounded text-[11px]">
            PKR / {settings.currencySymbol || 'Rs.'}
          </span>
        </div>
      </aside>
    </>
  );
};
