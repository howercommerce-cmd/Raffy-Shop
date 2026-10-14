import React, { useState } from 'react';
import { X, Boxes, AlertTriangle, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';

interface AdjustStockModalProps {
  product: Product;
  onClose: () => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({ product, onClose }) => {
  const { adjustStock } = useShop();

  const [adjustmentType, setAdjustmentType] = useState<'adjustment' | 'damage' | 'return'>('adjustment');
  const [newQuantity, setNewQuantity] = useState<number>(product.quantity);
  const [reason, setReason] = useState<string>('Physical count reconciliation');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const delta = newQuantity - product.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuantity < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    if (delta === 0) {
      setError('Stock quantity is unchanged.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await adjustStock(product.id, newQuantity, reason.trim(), adjustmentType);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update stock';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold">Manual Stock Adjustment</h3>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-xs">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mx-4 mt-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current Stock vs New Stock */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Current Stock:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {product.quantity} {product.unit || 'pcs'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 block">Difference:</span>
              <span
                className={`font-mono font-bold text-sm ${
                  delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                {delta > 0 ? `+${delta}` : delta} {product.unit || 'pcs'}
              </span>
            </div>
          </div>

          {/* New Stock Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              New Verified Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Reason Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'adjustment', label: 'Physical Audit' },
                { id: 'damage', label: 'Damage / Expired' },
                { id: 'return', label: 'Restock / Return' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setAdjustmentType(t.id as any);
                    if (t.id === 'damage') setReason('Damaged or expired goods written off');
                    else if (t.id === 'return') setReason('Goods returned back into inventory');
                    else setReason('Physical stock audit correction');
                  }}
                  className={`py-2 px-2 rounded-xl font-semibold border text-center transition cursor-pointer ${
                    adjustmentType === t.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Details */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Reason / Audit Note *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken packaging during transport"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Updating...' : 'Save Stock Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
