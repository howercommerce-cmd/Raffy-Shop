import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShopProvider, useShop } from './context/ShopContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './components/DashboardView';
import { POSView } from './components/POSView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { CustomersView } from './components/CustomersView';
import { PurchasesView } from './components/PurchasesView';
import { SuppliersView } from './components/SuppliersView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ProductModal } from './components/ProductModal';
import { AdjustStockModal } from './components/AdjustStockModal';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { ActiveTab, Product, Sale } from './types';
import { Store } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { loadingData } = useShop();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal States
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [printingSale, setPrintingSale] = useState<{ sale: Sale; type: 'thermal' | 'a4' } | null>(
    null
  );

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
          <Store className="w-6 h-6" />
        </div>
        <div className="text-base font-bold">Smart Shop Management System</div>
        <p className="text-xs text-slate-400 mt-1">Connecting to Firestore Database...</p>
      </div>
    );
  }

  // If not signed in, show Google Auth Login Screen
  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setMobileOpen={setMobileSidebarOpen}
          onOpenAddProductModal={() => {
            setEditingProduct(null);
            setShowProductModal(true);
          }}
        />

        {/* Tab Views Container */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={setActiveTab}
              onOpenAddProductModal={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              onViewSale={(sale) => setPrintingSale({ sale, type: 'thermal' })}
            />
          )}

          {activeTab === 'pos' && (
            <POSView
              onSaleCompleted={(sale, printType) => setPrintingSale({ sale, type: printType })}
              onOpenAddProductModal={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              onOpenAddModal={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              onEditProduct={(product) => {
                setEditingProduct(product);
                setShowProductModal(true);
              }}
              onAdjustStock={(product) => setAdjustingProduct(product)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              onAdjustStock={(product) => setAdjustingProduct(product)}
              onOpenRestockPurchase={() => setActiveTab('purchases')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesHistoryView
              onPrintSale={(sale) => setPrintingSale({ sale, type: 'thermal' })}
            />
          )}

          {activeTab === 'customers' && <CustomersView />}

          {activeTab === 'purchases' && <PurchasesView />}

          {activeTab === 'suppliers' && <SuppliersView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      {/* 1. Add / Edit Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* 2. Manual Stock Adjustment Modal */}
      {adjustingProduct && (
        <AdjustStockModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
        />
      )}

      {/* 3. Print Receipt & Invoice Modal */}
      {printingSale && (
        <PrintReceiptModal
          sale={printingSale.sale}
          initialType={printingSale.type}
          onClose={() => setPrintingSale(null)}
          onNewBill={() => {
            setPrintingSale(null);
            setActiveTab('pos');
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <MainApp />
      </ShopProvider>
    </AuthProvider>
  );
}
