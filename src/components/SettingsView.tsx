import React, { useState } from 'react';
import {
  Settings,
  Save,
  CheckCircle,
  Database,
  Download,
  Smartphone,
  Barcode,
  HelpCircle,
  Store,
  RefreshCw,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useAuth } from '../context/AuthContext';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, products, sales, customers, suppliers } = useShop();
  const { user } = useAuth();

  const [shopName, setShopName] = useState(settings.shopName || 'Bismillah General Store');
  const [address, setAddress] = useState(settings.address || '');
  const [phone, setPhone] = useState(settings.phone || '');
  const [receiptFooter, setReceiptFooter] = useState(
    settings.receiptFooter || 'Thank you for shopping with us! / سامان تبدیل یا واپس 7 دن کے اندر ہو سکتا ہے۔'
  );
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || 'Rs.');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || 'INV');
  const [defaultLowStockThreshold, setDefaultLowStockThreshold] = useState(
    settings.defaultLowStockThreshold || 5
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await updateSettings({
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        receiptFooter: receiptFooter.trim(),
        currencySymbol: currencySymbol.trim(),
        invoicePrefix: invoicePrefix.trim().toUpperCase(),
        defaultLowStockThreshold: Number(defaultLowStockThreshold) || 5,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Full Store JSON Backup Export
  const handleExportBackup = () => {
    const backupData = {
      exportDate: new Date().toISOString(),
      shopSettings: settings,
      products,
      sales,
      customers,
      suppliers,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart_shop_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Settings Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Shop Profile & Receipt Settings</h3>
              <p className="text-[11px] text-slate-400">
                These details appear on your printed receipts and customer invoices
              </p>
            </div>
          </div>
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5" /> Saved Successfully!
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Retail Shop Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Bismillah General Store"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Store Physical Address *</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop # 14, Commercial Market, Main Road, Lahore"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="Rs."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default: Rs. or PKR</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. INV-20261013-XXXX</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Default Low-Stock Alert
              </label>
              <input
                type="number"
                min="1"
                value={defaultLowStockThreshold}
                onChange={(e) => setDefaultLowStockThreshold(parseInt(e.target.value) || 1)}
                placeholder="5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Units remaining</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Receipt Footer Message (Urdu / English)
            </label>
            <textarea
              rows={2}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Thank you for shopping with us! / سامان تبدیل یا واپس 7 دن کے اندر ہو سکتا ہے۔"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Cloud Database & Backup Export */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Firebase Firestore Cloud Sync</h4>
              <p className="text-xs text-slate-500">Live multi-device database storage status</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">Online & Active</span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Firebase Project ID</span>
            <span className="font-mono font-bold text-slate-800 block mt-0.5">
              {firebaseConfig.projectId}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Firestore Database</span>
            <span className="font-mono font-bold text-slate-800 block mt-0.5 truncate">
              {firebaseConfig.firestoreDatabaseId}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Logged-in Shopkeeper</span>
            <span className="font-bold text-slate-800 block mt-0.5">{user?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Database Records</span>
            <span className="font-mono font-bold text-slate-800 block mt-0.5">
              {products.length} Products • {sales.length} Bills • {customers.length} Customers
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Download an offline JSON copy of all store records, inventory, and customer ledgers.
          </p>
          <button
            onClick={handleExportBackup}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Full Backup (JSON)</span>
          </button>
        </div>
      </div>

      {/* Hardware & Mobile Access Instructions Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-600" /> Physical Shop Operation Guide
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Barcode className="w-4 h-4 text-emerald-600" />
              <span>Barcode Scanners</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Any standard USB or Bluetooth handheld barcode scanner works instantly. Simply click the search
              box on the POS screen and pull the trigger; it will type the barcode and add the item.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Tablet & Phone Access</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              The entire application is 100% mobile responsive. Open your App URL on your shop tablet or mobile
              browser, sign in with the same Google Account, and manage bills on the counter.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Thermal Receipt Printers</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Supports standard 80mm or 58mm thermal receipt printers (POS-80 / Xprinter / Rongta / Epson).
              Select "Thermal (80mm)" in print mode and choose your receipt printer in the browser print dialog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
