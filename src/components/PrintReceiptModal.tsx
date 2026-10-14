import React, { useState } from 'react';
import { Printer, Download, X, CheckCircle, FileText, Store } from 'lucide-react';
import { Sale } from '../types';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDateTime } from '../utils/format';

interface PrintReceiptModalProps {
  sale: Sale;
  initialType?: 'thermal' | 'a4';
  onClose: () => void;
  onNewBill?: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  sale,
  initialType = 'thermal',
  onClose,
  onNewBill,
}) => {
  const { settings } = useShop();
  const [formatType, setFormatType] = useState<'thermal' | 'a4'>(initialType);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Container Dialog */}
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Top Actions (Hidden in print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Print Receipt & Invoice</h3>
              <p className="text-[11px] text-slate-400">Invoice: #{sale.invoiceNumber}</p>
            </div>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormatType('thermal')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  formatType === 'thermal'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Thermal (80mm)
              </button>
              <button
                type="button"
                onClick={() => setFormatType('a4')}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  formatType === 'a4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                A4 Invoice
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar (Print, PDF, New Bill) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Now (Ctrl + P)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              title="Use print dialog to save as PDF"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </button>
          </div>

          {onNewBill && (
            <button
              onClick={onNewBill}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
            >
              + Start New Bill
            </button>
          )}
        </div>

        {/* Printable Paper Preview Area */}
        <div className="p-6 bg-slate-100/60 max-h-[70vh] overflow-y-auto flex justify-center">
          {/* Printable Area Wrapper with ID for print styles */}
          <div
            id="printable-area"
            className={`bg-white shadow-md border border-slate-200 text-slate-900 transition-all ${
              formatType === 'thermal'
                ? 'w-[320px] p-5 font-mono text-[11px] leading-tight'
                : 'w-full max-w-[580px] p-8 text-xs font-sans'
            }`}
          >
            {/* THERMAL RECEIPT LAYOUT */}
            {formatType === 'thermal' ? (
              <div className="space-y-3">
                {/* Header */}
                <div className="text-center pb-2 border-b border-dashed border-slate-300">
                  <h2 className="text-sm font-bold uppercase tracking-wider">
                    {settings.shopName || 'Bismillah General Store'}
                  </h2>
                  <p className="text-[10px] text-slate-600 mt-0.5">{settings.address}</p>
                  <p className="text-[10px] text-slate-600 font-bold">Tel: {settings.phone}</p>
                  <div className="mt-1 pt-1 border-t border-dashed border-slate-200 text-[10px] text-slate-500">
                    CASH RECEIPT / بل رسید
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-0.5 text-[10px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Invoice #:</span>
                    <span className="font-bold">{sale.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{formatDateTime(sale.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{sale.customerName || 'Walk-in'}</span>
                  </div>
                  {sale.customerPhone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{sale.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{sale.cashierName || 'Admin'}</span>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="border-b border-dashed border-slate-300 pb-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-300 text-[9px] font-bold uppercase">
                        <th className="py-1">Item</th>
                        <th className="py-1 text-center">Qty</th>
                        <th className="py-1 text-right">Rate</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dotted divide-slate-200">
                      {sale.items.map((it, idx) => (
                        <tr key={idx} className="py-1">
                          <td className="py-1 pr-1 truncate max-w-[120px] font-medium">{it.name}</td>
                          <td className="py-1 text-center font-bold">{it.quantity}</td>
                          <td className="py-1 text-right">{Math.round(it.salePrice)}</td>
                          <td className="py-1 text-right font-bold">{Math.round(it.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(sale.subtotal, settings.currencySymbol)}</span>
                  </div>
                  {sale.discountAmount > 0 && (
                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>Discount:</span>
                      <span>-{formatCurrency(sale.discountAmount, settings.currencySymbol)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300">
                    <span>GRAND TOTAL:</span>
                    <span>{formatCurrency(sale.totalAmount, settings.currencySymbol)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid ({sale.paymentMethod}):</span>
                    <span>{formatCurrency(sale.paidAmount, settings.currencySymbol)}</span>
                  </div>
                  {sale.balanceDue > 0 ? (
                    <div className="flex justify-between font-bold text-rose-600">
                      <span>Balance Due (Khata):</span>
                      <span>{formatCurrency(sale.balanceDue, settings.currencySymbol)}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-bold">PAID IN FULL</span>
                    </div>
                  )}
                </div>

                {/* Footer Message */}
                <div className="text-center pt-1 text-[10px] text-slate-600 space-y-1">
                  <p className="font-semibold leading-relaxed">
                    {settings.receiptFooter || 'Thank you for shopping with us!'}
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono">
                    Software: Smart Shop Management System
                  </p>
                </div>
              </div>
            ) : (
              /* STANDARD A4 INVOICE LAYOUT */
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {settings.shopName || 'Bismillah General Store'}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{settings.address}</p>
                    <p className="text-xs text-slate-500 font-medium">Contact: {settings.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-emerald-700 tracking-wider">
                      SALES INVOICE
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                      #{sale.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(sale.createdAt)}</p>
                  </div>
                </div>

                {/* Customer Info Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Billed To
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {sale.customerName || 'Walk-in Customer'}
                    </span>
                    {sale.customerPhone && (
                      <span className="text-xs text-slate-500 block">Phone: {sale.customerPhone}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Payment Details
                    </span>
                    <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                      Method: {sale.paymentMethod}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 block">
                      Status: {sale.balanceDue > 0 ? 'Partial Credit' : 'Fully Paid'}
                    </span>
                  </div>
                </div>

                {/* Items Table */}
                <div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Product Name</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3 text-center">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sale.items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{it.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{it.code}</td>
                          <td className="py-2 px-3 text-center font-bold">{it.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatCurrency(it.salePrice, settings.currencySymbol)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(it.subtotal, settings.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Calculation Summary */}
                <div className="flex justify-end pt-2">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono font-bold">
                        {formatCurrency(sale.subtotal, settings.currencySymbol)}
                      </span>
                    </div>
                    {sale.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-semibold">
                        <span>Discount:</span>
                        <span className="font-mono">
                          -{formatCurrency(sale.discountAmount, settings.currencySymbol)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="font-mono text-emerald-700">
                        {formatCurrency(sale.totalAmount, settings.currencySymbol)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Amount Paid:</span>
                      <span className="font-mono">
                        {formatCurrency(sale.paidAmount, settings.currencySymbol)}
                      </span>
                    </div>
                    {sale.balanceDue > 0 && (
                      <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-100">
                        <span>Balance Due:</span>
                        <span className="font-mono">
                          {formatCurrency(sale.balanceDue, settings.currencySymbol)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Terms and Signature */}
                <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-500">
                  <div>
                    <p className="font-bold text-slate-700">Terms & Conditions:</p>
                    <p className="text-[11px]">{settings.receiptFooter}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-36 border-b border-slate-400 mb-1" />
                    <span className="text-[10px] text-slate-400">Authorized Signature</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
