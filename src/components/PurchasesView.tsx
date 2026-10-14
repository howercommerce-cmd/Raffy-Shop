import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Truck, Search, Trash2, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatCurrency, formatDateTime } from '../utils/format';
import { Product } from '../types';

export const PurchasesView: React.FC<{ onOpenAddPurchase?: () => void }> = () => {
  const { purchases, suppliers, products, addPurchase, settings } = useShop();

  const [showModal, setShowModal] = useState(false);
  const [purchaseNum, setPurchaseNum] = useState(
    `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Items to restock in this purchase
  const [items, setItems] = useState<
    { productId: string; name: string; quantity: number; unitCost: number; totalCost: number }[]
  >([]);

  // Item selector in form
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState<number>(10);
  const [itemCost, setItemCost] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProductId(pId);
    const found = products.find((p) => p.id === pId);
    if (found) {
      setItemCost(found.purchasePrice);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId || itemQty <= 0 || itemCost <= 0) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        name: prod.name,
        quantity: itemQty,
        unitCost: itemCost,
        totalCost: itemQty * itemCost,
      },
    ]);

    setSelectedProductId('');
    setItemQty(10);
    setItemCost(0);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSupplierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSupplierId(sId);
    const found = suppliers.find((s) => s.id === sId);
    if (found) {
      setSupplierName(found.name);
      setSupplierPhone(found.phone || '');
    } else {
      setSupplierName('General Market Supplier');
      setSupplierPhone('');
    }
  };

  const totalPurchaseAmount = items.reduce((sum, it) => sum + it.totalCost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      await addPurchase({
        purchaseNumber: purchaseNum,
        supplierId: selectedSupplierId || undefined,
        supplierName: supplierName || 'General Supplier',
        supplierPhone: supplierPhone || undefined,
        items,
        totalAmount: totalPurchaseAmount,
        notes,
      });

      setShowModal(false);
      setItems([]);
      setNotes('');
      setPurchaseNum(
        `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
          100 + Math.random() * 900
        )}`
      );
    } catch (err) {
      console.error('Failed to save purchase:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Inventory Purchases & Stock In</h3>
          <p className="text-xs text-slate-500">
            Record supplier orders to automatically increase product quantities & update costs
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Record Restock Purchase</span>
        </button>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {purchases.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700">No purchases recorded yet</h4>
            <p className="text-slate-400 mt-0.5">
              Restock purchases from distributors will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Purchase Order #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Products Received</th>
                  <th className="py-3 px-4 text-right">Total Purchase Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{p.purchaseNumber}</td>
                    <td className="py-3 px-3 text-slate-500 font-mono">{formatDateTime(p.createdAt)}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{p.supplierName}</td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-slate-600">
                        {p.items?.reduce((a, b) => a + b.quantity, 0) || 0} units (
                        {p.items?.length || 0} items)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(p.totalAmount, settings.currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">Record Incoming Restock Purchase</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Purchase / Bill # *</label>
                  <input
                    type="text"
                    required
                    value={purchaseNum}
                    onChange={(e) => setPurchaseNum(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={handleSupplierSelect}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                  >
                    <option value="">General Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.company || 'Distributor'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Add item to order section */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-800 block">Add Purchased Product</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-3">
                    <select
                      value={selectedProductId}
                      onChange={handleProductSelect}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="">-- Choose Product to Restock --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Current: {p.quantity} {p.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">Quantity to Add</label>
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-600 block mb-0.5">
                      Cost per Unit ({settings.currencySymbol || 'Rs.'})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemCost}
                      onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition disabled:opacity-40 cursor-pointer"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List in order */}
              {items.length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-800 mb-2">Order Line Items</h5>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {items.map((it, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                        <div>
                          <span className="font-bold text-slate-900">{it.name}</span>
                          <span className="text-slate-500 font-mono block text-[11px]">
                            {it.quantity} units @ {formatCurrency(it.unitCost, settings.currencySymbol)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(it.totalCost, settings.currencySymbol)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 font-bold text-sm">
                    <span>Total Purchase Cost:</span>
                    <span className="font-mono text-emerald-700">
                      {formatCurrency(totalPurchaseAmount, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || items.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Receiving Stock...' : 'Save & Restock Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
