import React, { useState, useEffect } from 'react';
import { Menu, Plus, ShoppingCart, LogOut, User as UserIcon, Store, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useShop } from '../context/ShopContext';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  setMobileOpen: (open: boolean) => void;
  onOpenAddProductModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  setMobileOpen,
  onOpenAddProductModal,
}) => {
  const { user, profile, signOut } = useAuth();
  const { settings } = useShop();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-PK', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }) +
          ' • ' +
          now.toLocaleTimeString('en-PK', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Dashboard', subtitle: 'Live overview of sales, stock & retail statistics' },
    pos: { title: 'Point of Sale (POS)', subtitle: 'Fast retail barcode scanning & customer checkout' },
    products: { title: 'Product Catalogue', subtitle: 'Manage prices, stock levels & barcode codes' },
    inventory: { title: 'Inventory & Stock Control', subtitle: 'Stock valuation, low stock warnings & audit logs' },
    sales: { title: 'Sales History', subtitle: 'All completed bills, reprints, returns & payments' },
    customers: { title: 'Customer Ledger (Khata)', subtitle: 'Track customer balances, credit purchases & debt recovery' },
    purchases: { title: 'Stock Restock Purchases', subtitle: 'Record supplier deliveries and update cost prices' },
    suppliers: { title: 'Suppliers Directory', subtitle: 'Manage distributor contacts and purchase history' },
    reports: { title: 'Daily Reports & Analytics', subtitle: 'Gross profit, cash flow, payment methods & summary' },
    settings: { title: 'Shop Settings', subtitle: 'Configure shop details, address, receipt text & currency' },
  };

  const current = titles[activeTab] || { title: 'Shop Management', subtitle: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 shadow-xs no-print">
      {/* Left: Mobile hamburger & Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight flex items-center gap-2">
            {current.title}
            {activeTab === 'pos' && (
              <span className="hidden sm:inline-flex text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active POS
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">{current.subtitle}</p>
        </div>
      </div>

      {/* Right: Clock, Quick Actions & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>{currentTime}</span>
        </div>

        {/* Quick Add Product Button */}
        <button
          onClick={onOpenAddProductModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-600" />
          <span>+ Product</span>
        </button>

        {/* Quick POS Button if on other page */}
        {activeTab !== 'pos' && (
          <button
            onClick={() => setActiveTab('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden xs:inline">New Bill</span>
          </button>
        )}

        {/* User Dropdown / Info */}
        <div className="flex items-center gap-2.5 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="flex items-center gap-2 text-left">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full border border-slate-300 object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="hidden md:block">
              <span className="text-xs font-bold text-slate-800 block leading-tight truncate max-w-[120px]">
                {user?.displayName || 'Shop Owner'}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
                {profile?.role === 'owner' ? 'Owner / Admin' : 'Cashier'}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
