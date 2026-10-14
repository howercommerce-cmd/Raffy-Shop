import React, { useState, useMemo } from 'react';
import {
  Search,
  Calendar,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  XCircle,
  CreditCard,
  FileText,
  AlertTriangle,
  Download,
  CheckCircle,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Sale, PaymentMethod } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

interface SalesHistoryViewProps {
  onPrintSale: (sale: Sale) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onPrintSale }) => {
  const { sales, refundSale, cancelSale, settings } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<
    'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom'
  >('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'refunded' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  // Detail Modal & Action Modals
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [refundModalSale, setRefundModalSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Customer returned goods');
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('Wrong bill entry');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = new Date();

    return sales.filter((s) => {
      // Status filter
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all' && s.paymentMethod !== paymentFilter) return false;

      // Date filter
      const saleDate = new Date(s.createdAt);

      if (dateRange === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (saleDate < today) return false;
      } else if (dateRange === 'yesterday') {
        const yStart = new Date();
        yStart.setDate(yStart.getDate() - 1);
        yStart.setHours(0, 0, 0, 0);
        const yEnd = new Date(yStart);
        yEnd.setHours(23, 59, 59, 999);
        if (saleDate < yStart || saleDate > yEnd) return false;
      } else if (dateRange === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        if (saleDate < weekAgo) return false;
      } else if (dateRange === 'month') {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        if (saleDate < monthStart) return false;
      } else if (dateRange === 'year') {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        if (saleDate < yearStart) return false;
      } else if (dateRange === 'custom') {
        if (customStart && saleDate < new Date(customStart)) return false;
        if (customEnd) {
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          if (saleDate > end) return false;
        }
      }

      // Search query
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q))
      );
    });
  }, [sales, statusFilter, paymentFilter, dateRange, customStart, customEnd, searchQuery]);

  // Aggregate totals of filtered sales
  const summary = useMemo(() => {
    let totalSales = 0;
    let totalProfit = 0;
    let totalReceived = 0;
    let totalBalanceDue = 0;

    filteredSales.forEach((s) => {
      if (s.status === 'cancelled') return;
      totalSales += s.totalAmount;
      totalProfit += s.grossProfit;
      totalReceived += s.paidAmount;
      totalBalanceDue += s.balanceDue;
    });

    return { totalSales, totalProfit, totalReceived, totalBalanceDue };
  }, [filteredSales]);

  // Handle Refund submission
  const handleRefundConfirm = async () => {
    if (!refundModalSale) return;
    setIsProcessing(true);
    try {
      await refundSale(refundModalSale.id, refundReason);
      setRefundModalSale(null);
      if (selectedSale?.id === refundModalSale.id) setSelectedSale(null);
    } catch (err) {
      console.error('Refund failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Cancel submission
  const handleCancelConfirm = async () => {
    if (!cancelModalSale) return;
    setIsProcessing(true);
    try {
      await cancelSale(cancelModalSale.id, cancelReason);
      setCancelModalSale(null);
      if (selectedSale?.id === cancelModalSale.id) setSelectedSale(null);
    } catch (err) {
      console.error('Cancel failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredSales.length === 0) return;
    const headers = [
      'Invoice #',
      'Date',
      'Customer',
      'Phone',
      'Payment Method',
      'Total Amount',
      'Cost (COGS)',
      'Gross Profit',
      'Paid Amount',
      'Balance Due',
      'Status',
    ];
    const rows = filteredSales.map((s) => [
      `"${s.invoiceNumber}"`,
      `"${s.createdAt}"`,
      `"${s.customerName || 'Walk-in'}"`,
      `"${s.customerPhone || ''}"`,
      `"${s.paymentMethod}"`,
      s.totalAmount,
      s.totalCost,
      s.grossProfit,
      s.paidAmount,
      s.balanceDue,
      `"${s.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Filtered Total Sales
          </span>
          <span className="text-lg font-black text-slate-900 font-mono block mt-1">
            {formatCurrency(summary.totalSales, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-400">From {filteredSales.length} bills</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Gross Profit Realized
          </span>
          <span className="text-lg font-black text-emerald-700 font-mono block mt-1">
            {formatCurrency(summary.totalProfit, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-emerald-600">Based on item cost snapshot</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Cash/Payment In
          </span>
          <span className="text-lg font-black text-blue-700 font-mono block mt-1">
            {formatCurrency(summary.totalReceived, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-slate-400">Total collected amount</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Outstanding Due (Khata)
          </span>
          <span className="text-lg font-black text-rose-600 font-mono block mt-1">
            {formatCurrency(summary.totalBalanceDue, settings.currencySymbol)}
          </span>
          <span className="text-[10px] text-rose-500">Unpaid customer balance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice #, customer name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'custom', label: 'Custom' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDateRange(d.id as any)}
                className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                  dateRange === d.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredSales.length === 0}
            className="p-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Secondary Filters row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">From:</span>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-slate-500 font-semibold">To:</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="py-1 px-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="refunded">Refunded / Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <span className="text-slate-500 ml-2">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">Cash</option>
              <option value="JazzCash">JazzCash</option>
              <option value="Easypaisa">Easypaisa</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredSales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No sales records found</h4>
            <p className="text-xs text-slate-400 mt-1">
              Try changing the search query or date range filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-3">Date / Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3 text-right">Profit</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 block">
                        {sale.customerName || 'Walk-in Customer'}
                      </span>
                      {sale.customerPhone && (
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {sale.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {sale.items.reduce((a, b) => a + b.quantity, 0)} items
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                      {sale.balanceDue > 0 && (
                        <span className="text-[10px] text-rose-600 block">
                          Due: {formatCurrency(sale.balanceDue, settings.currencySymbol)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {sale.status === 'cancelled'
                        ? 'Rs. 0'
                        : `+${formatCurrency(sale.grossProfit, settings.currencySymbol)}`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sale.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sale.status === 'refunded'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          title="View Bill Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintSale(sale)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Reprint Bill"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Bill Details: #{selectedSale.invoiceNumber}</h3>
                <p className="text-xs text-slate-400">{formatDateTime(selectedSale.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Customer and Status info */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedSale.customerName || 'Walk-in Customer'}
                  </span>
                  {selectedSale.customerPhone && (
                    <span className="text-slate-500 block">{selectedSale.customerPhone}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment</span>
                  <span className="font-bold text-slate-900 block mt-0.5">
                    {selectedSale.paymentMethod}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                      selectedSale.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedSale.status === 'refunded'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {selectedSale.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 className="font-bold text-slate-800 mb-2">Line Items (Snapshot at Sale Time)</h5>
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Sale Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSale.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium text-slate-900">{it.name}</td>
                        <td className="p-2 text-center font-bold">{it.quantity}</td>
                        <td className="p-2 text-right font-mono text-slate-500">
                          {formatCurrency(it.purchasePrice, settings.currencySymbol)}
                        </td>
                        <td className="p-2 text-right font-mono text-slate-900">
                          {formatCurrency(it.salePrice, settings.currencySymbol)}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(it.subtotal, settings.currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedSale.subtotal, settings.currencySymbol)}</span>
                </div>
                {selectedSale.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(selectedSale.discountAmount, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(selectedSale.totalAmount, settings.currencySymbol)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(selectedSale.paidAmount, settings.currencySymbol)}</span>
                </div>
                {selectedSale.balanceDue > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Remaining Due:</span>
                    <span>{formatCurrency(selectedSale.balanceDue, settings.currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                  <span>Gross Profit (COGS Deducted):</span>
                  <span>+{formatCurrency(selectedSale.grossProfit, settings.currencySymbol)}</span>
                </div>
              </div>

              {/* Audit trail reason if refunded/cancelled */}
              {(selectedSale.refundReason || selectedSale.cancellationReason) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <strong>Audit Reason:</strong>{' '}
                  {selectedSale.refundReason || selectedSale.cancellationReason}
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  {selectedSale.status === 'completed' && (
                    <>
                      <button
                        onClick={() => {
                          setRefundModalSale(selectedSale);
                        }}
                        className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-semibold transition cursor-pointer"
                      >
                        Refund / Return
                      </button>
                      <button
                        onClick={() => {
                          setCancelModalSale(selectedSale);
                        }}
                        className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-semibold transition cursor-pointer"
                      >
                        Cancel Bill
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => {
                    onPrintSale(selectedSale);
                    setSelectedSale(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Reprint Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalSale && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-slate-900 mb-1">Process Return & Refund</h4>
            <p className="text-xs text-slate-600 mb-3">
              Bill #{refundModalSale.invoiceNumber}. Product quantities will be automatically returned
              to inventory stock.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Reason for Return *
                </label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. Defective item, customer changed mind"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalSale(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRefundConfirm}
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Return & Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Bill Modal */}
      {cancelModalSale && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h4 className="text-base font-bold text-rose-700 mb-1">Cancel Bill (Audit Reversal)</h4>
            <p className="text-xs text-slate-600 mb-3">
              Cancelling Bill #{cancelModalSale.invoiceNumber} will restore inventory stock and keep an
              audit record.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cancellation Reason *
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Duplicate bill entered by mistake"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Abort
                </button>
                <button
                  type="button"
                  onClick={handleCancelConfirm}
                  disabled={isProcessing}
                  className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isProcessing ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
