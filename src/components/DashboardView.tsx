import React, { useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  Package,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  ShoppingCart,
  Plus,
  ArrowUpRight,
  Eye,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { ActiveTab, Sale } from '../types';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAddProductModal: () => void;
  onViewSale: (sale: Sale) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenAddProductModal,
  onViewSale,
}) => {
  const {
    products,
    sales,
    customers,
    dashboardStats,
    settings,
    seedDemoProducts,
  } = useShop();

  // 7-Day sales calculation for interactive chart
  const last7DaysData = useMemo(() => {
    const days: { dateStr: string; label: string; total: number; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextD = new Date(d);
      nextD.setDate(d.getDate() + 1);

      const daySales = sales.filter((s) => {
        if (s.status === 'cancelled') return false;
        const sDate = new Date(s.createdAt);
        return sDate >= d && sDate < nextD;
      });

      const total = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const label = i === 0 ? 'Today' : d.toLocaleDateString('en-PK', { weekday: 'short' });
      days.push({
        dateStr: d.toISOString().slice(0, 10),
        label,
        total,
        count: daySales.length,
      });
    }
    return days;
  }, [sales]);

  const maxDaySales = useMemo(() => {
    const max = Math.max(...last7DaysData.map((d) => d.total));
    return max > 0 ? max : 1000;
  }, [last7DaysData]);

  // Payment methods breakdown for today
  const paymentBreakdown = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      return new Date(s.createdAt) >= today;
    });

    const breakdown: Record<string, number> = {
      Cash: 0,
      JazzCash: 0,
      Easypaisa: 0,
      'Bank Transfer': 0,
      Other: 0,
    };

    todaySales.forEach((s) => {
      const method = s.paymentMethod || 'Cash';
      breakdown[method] = (breakdown[method] || 0) + s.paidAmount;
    });

    return breakdown;
  }, [sales]);

  // Low stock products list
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => p.quantity <= (p.lowStockThreshold ?? 5))
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [products]);

  // Recent 6 transactions
  const recentSales = useMemo(() => {
    return sales.slice(0, 6);
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner when shop has no products yet */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Welcome to Your Smart Shop POS!
            </div>
            <h2 className="text-xl font-bold">Start Managing Your Shop Catalog & Billing</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              Add your physical store products, or load realistic starter Pakistani grocery & retail items
              (Tapal Tea, Olpers Milk, Dalda Oil, Basmati Rice, etc.) to test fast billing right now.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => seedDemoProducts()}
              className="px-4 py-2.5 bg-white text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition-colors shadow cursor-pointer"
            >
              ⚡ Load Sample Retail Products
            </button>
            <button
              onClick={onOpenAddProductModal}
              className="px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              + Add Custom Product
            </button>
          </div>
        </div>
      )}

      {/* 6 Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Today's Sales */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatCurrency(dashboardStats.todaySales, settings.currencySymbol)}
            </div>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1 mt-0.5">
              <span>Verified sales today</span>
            </span>
          </div>
        </div>

        {/* Today's Bills */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Bills</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {dashboardStats.todayBillsCount}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Invoices generated today
            </span>
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Profit</span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {formatCurrency(dashboardStats.todayProfit, settings.currencySymbol)}
            </div>
            <span className="text-[11px] font-medium text-teal-600 mt-0.5 block">
              Based on purchase costs
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-slate-900 font-mono">
              {dashboardStats.totalProductsCount}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Items in store catalog
            </span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => setActiveTab('inventory')}
          className={`bg-white rounded-2xl p-4 border shadow-xs hover:shadow-md transition-all cursor-pointer ${
            dashboardStats.lowStockCount > 0
              ? 'border-amber-300 bg-amber-50/20'
              : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dashboardStats.lowStockCount > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-xl font-black font-mono ${
                dashboardStats.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {dashboardStats.lowStockCount}
            </div>
            <span
              className={`text-[11px] font-semibold mt-0.5 block ${
                dashboardStats.lowStockCount > 0 ? 'text-amber-700' : 'text-slate-500'
              }`}
            >
              {dashboardStats.lowStockCount > 0 ? 'Needs reordering' : 'Stock levels healthy'}
            </span>
          </div>
        </div>

        {/* Total Outstanding Customer Balance (Khata) */}
        <div
          onClick={() => setActiveTab('customers')}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Khata</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-rose-600 font-mono">
              {formatCurrency(dashboardStats.totalReceivables, settings.currencySymbol)}
            </div>
            <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">
              Total credit receivables
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: 7-Day Sales Trend & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Daily Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales Performance</h3>
              <p className="text-xs text-slate-500">Daily revenue and transaction count from live bills</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              Full Reports <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {last7DaysData.map((d, index) => {
              const heightPercent = maxDaySales > 0 ? (d.total / maxDaySales) * 100 : 0;
              const isToday = index === 6;

              return (
                <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1 px-2 rounded-lg font-mono pointer-events-none whitespace-nowrap mb-1 shadow-md">
                    {formatCurrency(d.total, settings.currencySymbol)} ({d.count} bills)
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg h-full flex items-end p-1">
                    <div
                      style={{ height: `${Math.max(6, heightPercent)}%` }}
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday
                          ? 'bg-emerald-500 group-hover:bg-emerald-600'
                          : 'bg-slate-700 group-hover:bg-slate-800'
                      }`}
                    />
                  </div>

                  {/* Day Label */}
                  <div className="text-center">
                    <span
                      className={`text-[11px] font-bold block ${
                        isToday ? 'text-emerald-600 font-extrabold' : 'text-slate-500'
                      }`}
                    >
                      {d.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {Math.round(d.total) > 0 ? `${Math.round(d.total / 1000)}k` : '0'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" /> Today's Sales
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-slate-700" /> Previous Days
            </span>
            <span className="font-medium text-slate-600">
              Week Total:{' '}
              <strong className="text-slate-900 font-mono">
                {formatCurrency(
                  last7DaysData.reduce((acc, d) => acc + d.total, 0),
                  settings.currencySymbol
                )}
              </strong>
            </span>
          </div>
        </div>

        {/* Payment Methods Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Payment Channels</h3>
                <p className="text-xs text-slate-500">Cash vs digital wallet breakdown</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Cash', color: 'bg-emerald-500', amount: paymentBreakdown['Cash'] || 0 },
                { name: 'JazzCash', color: 'bg-amber-500', amount: paymentBreakdown['JazzCash'] || 0 },
                { name: 'Easypaisa', color: 'bg-green-600', amount: paymentBreakdown['Easypaisa'] || 0 },
                { name: 'Bank Transfer', color: 'bg-blue-600', amount: paymentBreakdown['Bank Transfer'] || 0 },
                { name: 'Other', color: 'bg-slate-400', amount: paymentBreakdown['Other'] || 0 },
              ].map((m) => {
                const totalPaidToday = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);
                const percent = totalPaidToday > 0 ? (m.amount / totalPaidToday) * 100 : 0;

                return (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
                        {m.name}
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrency(m.amount, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${m.color} transition-all duration-300`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveTab('pos')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Billing Terminal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Bills & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Customer Bills</h3>
              <p className="text-xs text-slate-500">Latest completed point of sale invoices</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              View All Bills <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentSales.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No bills generated yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Completed invoices will automatically appear here.
              </p>
              <button
                onClick={() => setActiveTab('pos')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Create First Sale
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/60">
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{formatDateTime(sale.createdAt)}</td>
                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {sale.customerName || 'Walk-in'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onViewSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="View / Print Receipt"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low Stock Watchlist</h3>
                <p className="text-xs text-slate-500">Products near or below alert limit</p>
              </div>
              <button
                onClick={() => setActiveTab('inventory')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Manage
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-xl text-center">
                <span className="text-2xl mb-1 block">✅</span>
                <p className="text-xs font-bold text-emerald-900">All Stock Healthy</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  No items currently below alert levels.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {p.code}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded text-[11px] font-mono">
                        {p.quantity} {p.unit || 'pcs'} left
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Min: {p.lowStockThreshold}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => setActiveTab('purchases')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              + Record Supplier Restock Purchase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
