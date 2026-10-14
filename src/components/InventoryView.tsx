import React, { useState, useMemo } from 'react';
import {
  Boxes,
  AlertTriangle,
  TrendingUp,
  Package,
  History,
  Search,
  Filter,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Product } from '../types';

interface InventoryViewProps {
  onAdjustStock: (product: Product) => void;
  onOpenRestockPurchase: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  onAdjustStock,
  onOpenRestockPurchase,
}) => {
  const { products, stockMovements, settings } = useShop();

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [searchQuery, setSearchQuery] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('all');

  // Valuation calculations
  const valuation = useMemo(() => {
    let totalCost = 0;
    let totalRetail = 0;
    let totalItems = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      const q = Math.max(0, p.quantity || 0);
      totalCost += q * (p.purchasePrice || 0);
      totalRetail += q * (p.salePrice || 0);
      totalItems += q;
      if (q <= (p.lowStockThreshold ?? 5)) {
        lowStockCount++;
      }
    });

    const potentialGrossProfit = totalRetail - totalCost;

    return {
      totalCost,
      totalRetail,
      potentialGrossProfit,
      totalItems,
      lowStockCount,
    };
  }, [products]);

  // Filtered current stock
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  // Filtered stock movement logs
  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      if (movementFilter !== 'all' && m.type !== movementFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.productName.toLowerCase().includes(q) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(q)) ||
        (m.reason && m.reason.toLowerCase().includes(q))
      );
    });
  }, [stockMovements, movementFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 4 Stock Valuation & Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Inventory Cost Valuation
          </span>
          <div className="mt-2 text-xl font-black text-slate-900 font-mono">
            {formatCurrency(valuation.totalCost, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Calculated at purchase cost price
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Retail Value
          </span>
          <div className="mt-2 text-xl font-black text-emerald-700 font-mono">
            {formatCurrency(valuation.totalRetail, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            Potential revenue at current retail prices
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Unrealized Gross Margin
          </span>
          <div className="mt-2 text-xl font-black text-teal-700 font-mono">
            +{formatCurrency(valuation.potentialGrossProfit, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-teal-600 font-medium mt-1 block">
            Estimated profit when all stock sells
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Physical Units
          </span>
          <div className="mt-2 text-xl font-black text-slate-900 font-mono">
            {valuation.totalItems} units
          </div>
          <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
            {valuation.lowStockCount} items at low-stock alert
          </span>
        </div>
      </div>

      {/* Navigation tabs & Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start">
          <button
            onClick={() => setActiveTab('current')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'current' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Current Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Audit Logs ({stockMovements.length})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stock..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenRestockPurchase}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Restock Purchase</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'current' ? (
        /* CURRENT STOCK TABLE */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Retail Price</th>
                  <th className="py-3 px-3 text-center">In-Stock Qty</th>
                  <th className="py-3 px-3 text-center">Alert Limit</th>
                  <th className="py-3 px-3 text-right">Inventory Cost Value</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const threshold = p.lowStockThreshold ?? 5;
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= threshold;
                  const lineCostVal = p.quantity * p.purchasePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{p.code}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(p.purchasePrice, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900 font-bold">
                        {formatCurrency(p.salePrice, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-full text-xs ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {p.quantity} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {threshold} {p.unit || 'pcs'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(lineCostVal, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onAdjustStock(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition cursor-pointer"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STOCK AUDIT MOVEMENT LOGS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Movement Type Filter Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-slate-500 font-medium">Filter Movement:</span>
            {['all', 'sale', 'purchase', 'adjustment', 'damage', 'return'].map((type) => (
              <button
                key={type}
                onClick={() => setMovementFilter(type)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition cursor-pointer ${
                  movementFilter === type
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {filteredMovements.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-xs">
              <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No stock movements recorded for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">Date / Time</th>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3 text-center">Change</th>
                    <th className="py-2.5 px-3 text-center">New Quantity</th>
                    <th className="py-2.5 px-3">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMovements.map((m) => {
                    const isPositive = m.quantityDelta > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 text-slate-500 font-mono">
                          {formatDateTime(m.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{m.productName}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              m.type === 'sale'
                                ? 'bg-blue-100 text-blue-800'
                                : m.type === 'purchase'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.type === 'damage'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
                            {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {m.newQuantity}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {m.reason || (m.referenceId ? `Ref: #${m.referenceId}` : '-')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
