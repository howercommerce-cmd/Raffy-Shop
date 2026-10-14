import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Tag,
  Download,
  Printer,
  FileText,
  PieChart,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatCurrency } from '../utils/format';

export const ReportsView: React.FC = () => {
  const { sales, customers, settings } = useShop();

  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Filter sales based on selected date
  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const saleDate = new Date(s.createdAt);

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return saleDate >= today;
      }
      if (dateFilter === 'yesterday') {
        const yStart = new Date();
        yStart.setDate(yStart.getDate() - 1);
        yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(yStart);
        yEnd.setHours(23, 59, 59, 999);
        return saleDate >= yStart && saleDate <= yEnd;
      }
      if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return saleDate >= weekAgo;
      }
      if (dateFilter === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return saleDate >= monthStart;
      }
      if (dateFilter === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return saleDate >= yearStart;
      }
      if (dateFilter === 'custom') {
        if (customStart && saleDate < new Date(customStart)) return false;
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (saleDate > end) return false;
        }
        return true;
      }
      return true;
    });
  }, [sales, dateFilter, customStart, customEnd]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let cashReceived = 0;
    let jazzCashSales = 0;
    let easypaisaSales = 0;
    let bankTransferSales = 0;
    let otherSales = 0;
    let totalDiscount = 0;
    let cogs = 0;
    let grossProfit = 0;
    let totalBalanceDue = 0;

    filteredSales.forEach((s) => {
      totalSales += s.totalAmount;
      totalPaid += s.paidAmount;
      totalDiscount += s.discountAmount || 0;
      cogs += s.totalCost || 0;
      grossProfit += s.grossProfit || 0;
      totalBalanceDue += s.balanceDue || 0;

      const p = s.paidAmount;
      if (s.paymentMethod === 'Cash') cashReceived += p;
      else if (s.paymentMethod === 'JazzCash') jazzCashSales += p;
      else if (s.paymentMethod === 'Easypaisa') easypaisaSales += p;
      else if (s.paymentMethod === 'Bank Transfer') bankTransferSales += p;
      else otherSales += p;
    });

    const profitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const totalTransactions = filteredSales.length;

    // Outstanding customer balances across the store
    const totalOutstandingKhata = customers.reduce(
      (sum, c) => sum + Math.max(0, c.outstandingBalance || 0),
      0
    );

    return {
      totalSales,
      totalPaid,
      cashReceived,
      jazzCashSales,
      easypaisaSales,
      bankTransferSales,
      otherSales,
      totalDiscount,
      cogs,
      grossProfit,
      profitMargin,
      totalBalanceDue,
      totalTransactions,
      totalOutstandingKhata,
    };
  }, [filteredSales, customers]);

  // Top selling products in this filtered period
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; quantity: number; revenue: number; profit: number }> =
      {};

    filteredSales.forEach((s) => {
      s.items?.forEach((it) => {
        if (!map[it.productId]) {
          map[it.productId] = { name: it.name, quantity: 0, revenue: 0, profit: 0 };
        }
        map[it.productId].quantity += it.quantity;
        map[it.productId].revenue += it.subtotal;
        map[it.productId].profit += it.subtotal - it.costTotal;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
  }, [filteredSales]);

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 no-print">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Financial Reports & Profit Analytics</h3>
          <p className="text-xs text-slate-500">
            Realized gross profit calculated from item purchase cost snapshots at time of sale
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: "Today's Report" },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom Range' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateFilter(d.id as any)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  dateFilter === d.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Custom Range picker if selected */}
      {dateFilter === 'custom' && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center gap-3 text-xs no-print">
          <span className="font-semibold text-slate-700">From Date:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl"
          />
          <span className="font-semibold text-slate-700">To Date:</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl"
          />
        </div>
      )}

      {/* Printable Report Wrapper */}
      <div id="printable-area" className="space-y-6">
        {/* Printable Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-200 pb-4 mb-5 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{settings.shopName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{settings.address} • Tel: {settings.phone}</p>
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                Report Period:{' '}
                <span className="capitalize font-bold text-slate-800">{dateFilter}</span>
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              Generated: {new Date().toLocaleDateString('en-PK')} • {new Date().toLocaleTimeString('en-PK')}
            </div>
          </div>

          {/* 8 Primary Financial Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Sales */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Sales Revenue
              </span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1.5">
                {formatCurrency(metrics.totalSales, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">{metrics.totalTransactions} transactions</span>
            </div>

            {/* Cost of Goods Sold (COGS) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cost of Goods Sold (COGS)
              </span>
              <span className="text-xl font-black text-slate-700 font-mono block mt-1.5">
                {formatCurrency(metrics.cogs, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">Inventory purchase cost</span>
            </div>

            {/* Estimated Gross Profit */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Estimated Gross Profit
              </span>
              <span className="text-xl font-black text-emerald-700 font-mono block mt-1.5">
                +{formatCurrency(metrics.grossProfit, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">
                Margin: {metrics.profitMargin.toFixed(1)}%
              </span>
            </div>

            {/* Total Discounts Given */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Discounts
              </span>
              <span className="text-xl font-black text-rose-600 font-mono block mt-1.5">
                {formatCurrency(metrics.totalDiscount, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">Promotions & concessions</span>
            </div>

            {/* Cash Received */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Cash In Register
              </span>
              <span className="text-xl font-black text-slate-900 font-mono block mt-1.5">
                {formatCurrency(metrics.cashReceived, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">Direct cash payments</span>
            </div>

            {/* Digital Wallets: JazzCash & Easypaisa */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                JazzCash / Easypaisa
              </span>
              <span className="text-xl font-black text-blue-700 font-mono block mt-1.5">
                {formatCurrency(metrics.jazzCashSales + metrics.easypaisaSales, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">Mobile wallet collection</span>
            </div>

            {/* Bank Transfers */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Bank Transfers
              </span>
              <span className="text-xl font-black text-indigo-700 font-mono block mt-1.5">
                {formatCurrency(metrics.bankTransferSales, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-slate-400">Direct bank account deposits</span>
            </div>

            {/* Total Outstanding Customer Debt (Khata) */}
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                Total Outstanding Khata
              </span>
              <span className="text-xl font-black text-rose-600 font-mono block mt-1.5">
                {formatCurrency(metrics.totalOutstandingKhata, settings.currencySymbol)}
              </span>
              <span className="text-[10px] text-rose-500 font-semibold">Store-wide unpaid balances</span>
            </div>
          </div>
        </div>

        {/* Breakdown Section: Payment Methods & Top Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payment Channels Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Methods Summary
            </h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="p-2.5">Channel</th>
                  <th className="p-2.5 text-right">Amount Received</th>
                  <th className="p-2.5 text-right">Share (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {[
                  { label: 'Cash', val: metrics.cashReceived },
                  { label: 'JazzCash', val: metrics.jazzCashSales },
                  { label: 'Easypaisa', val: metrics.easypaisaSales },
                  { label: 'Bank Transfer', val: metrics.bankTransferSales },
                  { label: 'Other', val: metrics.otherSales },
                ].map((row) => {
                  const share = metrics.totalPaid > 0 ? (row.val / metrics.totalPaid) * 100 : 0;
                  return (
                    <tr key={row.label}>
                      <td className="p-2.5 font-sans font-semibold text-slate-800">{row.label}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(row.val, settings.currencySymbol)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500">{share.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Selling Items
            </h4>
            {topProducts.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">No sales in this period.</p>
            ) : (
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Qty Sold</th>
                    <th className="p-2.5 text-right">Revenue</th>
                    <th className="p-2.5 text-right">Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {topProducts.map((p, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-sans font-semibold text-slate-900 truncate max-w-[140px]">
                        {p.name}
                      </td>
                      <td className="p-2.5 text-center font-bold">{p.quantity}</td>
                      <td className="p-2.5 text-right text-slate-800">
                        {formatCurrency(p.revenue, settings.currencySymbol)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">
                        +{formatCurrency(p.profit, settings.currencySymbol)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
