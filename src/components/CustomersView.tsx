import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  CreditCard,
  Printer,
  History,
  FileText,
  DollarSign,
  X,
  CheckCircle,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Customer, PaymentMethod, Sale } from '../types';
import { formatCurrency, formatDateTime } from '../utils/format';

export const CustomersView: React.FC = () => {
  const { customers, sales, payments, addCustomer, updateCustomer, recordCustomerPayment, settings } =
    useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Customer Form state
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // Receive Payment Modal
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Statement / Ledger Modal
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Total store receivables
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + Math.max(0, c.outstandingBalance || 0), 0);
  }, [customers]);

  // Open Edit
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setCustName(customer.name);
    setCustPhone(customer.phone || '');
    setCustAddress(customer.address || '');
    setCustNotes(customer.notes || '');
    setShowAddModal(true);
  };

  // Submit Add / Edit
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: custName.trim(),
          phone: custPhone.trim(),
          address: custAddress.trim(),
          notes: custNotes.trim(),
        });
      } else {
        await addCustomer({
          name: custName.trim(),
          phone: custPhone.trim(),
          address: custAddress.trim(),
          notes: custNotes.trim(),
        });
      }

      setShowAddModal(false);
      setEditingCustomer(null);
      setCustName('');
      setCustPhone('');
      setCustAddress('');
      setCustNotes('');
    } catch (err) {
      console.error('Save customer failed:', err);
    }
  };

  // Submit Debt Payment
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer || !paymentAmount || Number(paymentAmount) <= 0) return;

    setSubmittingPayment(true);
    try {
      await recordCustomerPayment(
        paymentCustomer.id,
        Number(paymentAmount),
        paymentMethod,
        paymentNotes || 'Cash debt recovery payment'
      );
      setPaymentCustomer(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err) {
      console.error('Failed to record payment:', err);
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Customer sales for Statement
  const statementSales = useMemo(() => {
    if (!statementCustomer) return [];
    return sales.filter((s) => s.customerId === statementCustomer.id);
  }, [statementCustomer, sales]);

  // Customer payments for Statement
  const statementPaymentsList = useMemo(() => {
    if (!statementCustomer) return [];
    return payments.filter((p) => p.customerId === statementCustomer.id);
  }, [statementCustomer, payments]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="text-xl font-black text-slate-900 font-mono mt-1 block">
              {customers.length}
            </span>
            <span className="text-[11px] text-slate-400">In Khata ledger</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Total Khata Receivables (Udhar)
            </span>
            <span className="text-xl font-black text-rose-600 font-mono mt-1 block">
              {formatCurrency(totalReceivables, settings.currencySymbol)}
            </span>
            <span className="text-[11px] text-rose-500 font-medium">Uncollected credit balances</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Customers with Credit Due
            </span>
            <span className="text-xl font-black text-amber-700 font-mono mt-1 block">
              {customers.filter((c) => (c.outstandingBalance || 0) > 0).length}
            </span>
            <span className="text-[11px] text-slate-400">Active debtors</span>
          </div>
          <button
            onClick={() => {
              setEditingCustomer(null);
              setCustName('');
              setCustPhone('');
              setCustAddress('');
              setCustNotes('');
              setShowAddModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer by name or phone..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No customers registered yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Customers are saved automatically during POS credit billing or added manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-right">Total Purchases</th>
                  <th className="py-3 px-3 text-right">Total Paid</th>
                  <th className="py-3 px-3 text-right">Outstanding Due (Khata)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const hasDue = (cust.outstandingBalance || 0) > 0;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{cust.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{cust.phone || '-'}</td>
                      <td className="py-3 px-3 text-slate-500 truncate max-w-xs">{cust.address || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                        {formatCurrency(cust.totalPurchases || 0, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700">
                        {formatCurrency(cust.totalPaid || 0, settings.currencySymbol)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {hasDue ? (
                          <span className="text-rose-600 font-black">
                            {formatCurrency(cust.outstandingBalance, settings.currencySymbol)}
                          </span>
                        ) : (
                          <span className="text-slate-400">Rs. 0 (Clear)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {hasDue && (
                            <button
                              onClick={() => {
                                setPaymentCustomer(cust);
                                setPaymentAmount(cust.outstandingBalance);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-xs cursor-pointer transition"
                            >
                              Receive Payment
                            </button>
                          )}
                          <button
                            onClick={() => setStatementCustomer(cust)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] cursor-pointer transition"
                            title="View Statement of Account"
                          >
                            Statement
                          </button>
                          <button
                            onClick={() => handleOpenEdit(cust)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-900 text-[11px] cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Haji Aslam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="0321-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Address</label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="House #, Street, City"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Khata Terms</label>
                <input
                  type="text"
                  value={custNotes}
                  onChange={(e) => setCustNotes(e.target.value)}
                  placeholder="e.g. Regular customer, settles bill weekly"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receive Debt Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <h4 className="text-sm font-bold">Receive Khata Debt Payment</h4>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <span className="text-[10px] text-rose-600 font-bold uppercase">Customer</span>
                <span className="font-bold text-slate-900 block">{paymentCustomer.name}</span>
                <span className="text-rose-700 font-mono font-black text-sm block mt-1">
                  Current Due: {formatCurrency(paymentCustomer.outstandingBalance, settings.currencySymbol)}
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Amount Received ({settings.currencySymbol || 'Rs.'}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentCustomer.outstandingBalance}
                  value={paymentAmount}
                  onChange={(e) =>
                    setPaymentAmount(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                >
                  <option value="Cash">Cash</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Easypaisa">Easypaisa</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Receipt Note</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Received via JazzCash"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  {submittingPayment ? 'Recording...' : 'Record Payment Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Statement Modal (Printable) */}
      {statementCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <div>
                <h3 className="text-base font-bold">
                  Account Ledger Statement: {statementCustomer.name}
                </h3>
                <p className="text-xs text-slate-400">Khata credit and payment audit report</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Statement
                </button>
                <button
                  onClick={() => setStatementCustomer(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Statement Printable Area */}
            <div id="printable-area" className="p-6 space-y-5 text-xs bg-white">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{settings.shopName}</h3>
                  <p className="text-slate-500 text-[11px]">{settings.address}</p>
                  <p className="text-slate-500 text-[11px]">Tel: {settings.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-slate-800">CUSTOMER LEDGER STATEMENT</span>
                  <p className="text-slate-400 text-[10px]">
                    Date: {new Date().toLocaleDateString('en-PK')}
                  </p>
                </div>
              </div>

              {/* Customer summary */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Details</span>
                  <span className="text-xs font-bold text-slate-900 block mt-0.5">
                    {statementCustomer.name}
                  </span>
                  <span className="text-slate-500 block">Phone: {statementCustomer.phone || 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Khata Balance</span>
                  <span className="text-base font-black text-rose-600 font-mono block mt-0.5">
                    {formatCurrency(statementCustomer.outstandingBalance, settings.currencySymbol)}
                  </span>
                  <span className="text-[10px] text-slate-500">Total Due for Settlement</span>
                </div>
              </div>

              {/* Invoices List */}
              <div>
                <h5 className="font-bold text-slate-800 mb-2">Purchase Invoices History</h5>
                {statementSales.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No bills recorded for this customer.</p>
                ) : (
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Invoice #</th>
                        <th className="p-2">Date</th>
                        <th className="p-2 text-right">Total Bill</th>
                        <th className="p-2 text-right">Paid</th>
                        <th className="p-2 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementSales.map((s) => (
                        <tr key={s.id}>
                          <td className="p-2 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                          <td className="p-2 text-slate-500">{formatDateTime(s.createdAt)}</td>
                          <td className="p-2 text-right font-mono font-bold">
                            {formatCurrency(s.totalAmount, settings.currencySymbol)}
                          </td>
                          <td className="p-2 text-right font-mono text-emerald-700">
                            {formatCurrency(s.paidAmount, settings.currencySymbol)}
                          </td>
                          <td className="p-2 text-right font-mono text-rose-600 font-bold">
                            {formatCurrency(s.balanceDue, settings.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Debt Payments Log */}
              {statementPaymentsList.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 mb-2">Khata Recovery Payments</h5>
                  <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2 text-right">Amount Received</th>
                        <th className="p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {statementPaymentsList.map((pay) => (
                        <tr key={pay.id}>
                          <td className="p-2 font-mono text-slate-500">{formatDateTime(pay.createdAt)}</td>
                          <td className="p-2 font-semibold text-slate-800">{pay.paymentMethod}</td>
                          <td className="p-2 text-right font-mono font-bold text-emerald-700">
                            +{formatCurrency(pay.amount, settings.currencySymbol)}
                          </td>
                          <td className="p-2 text-slate-500">{pay.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
