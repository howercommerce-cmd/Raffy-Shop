import React, { useState, useEffect } from 'react';
import { X, Sparkles, Barcode, TrendingUp, AlertCircle } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, settings, products } = useShop();

  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name || '');
  const [code, setCode] = useState(product?.code || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [category, setCategory] = useState(product?.category || 'General');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>(product?.purchasePrice ?? '');
  const [salePrice, setSalePrice] = useState<number | ''>(product?.salePrice ?? '');
  const [quantity, setQuantity] = useState<number | ''>(product?.quantity ?? 10);
  const [lowStockThreshold, setLowStockThreshold] = useState<number | ''>(
    product?.lowStockThreshold ?? (settings.defaultLowStockThreshold || 5)
  );
  const [description, setDescription] = useState(product?.description || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Existing categories for quick select
  const existingCategories = Array.from(
    new Set([
      'General',
      'Beverages',
      'Dairy',
      'Cooking Oils',
      'Grains & Rice',
      'Spices',
      'Sauces',
      'Snacks & Biscuits',
      'Household',
      'Personal Care',
      'Pharmacy & General',
      ...products.map((p) => p.category).filter(Boolean),
    ])
  );

  // Auto-generate unique barcode / SKU if empty
  const handleGenerateBarcode = () => {
    const randomCode = '896' + Math.floor(100000000 + Math.random() * 900000000);
    setBarcode(randomCode);
    if (!code) {
      const initials = name
        ? name
            .split(' ')
            .map((w) => w[0]?.toUpperCase())
            .join('')
            .slice(0, 4)
        : 'PRD';
      setCode(`${initials}-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  // Profit Margin calculation
  const pPrice = Number(purchasePrice) || 0;
  const sPrice = Number(salePrice) || 0;
  const profit = sPrice - pPrice;
  const marginPercent = sPrice > 0 ? (profit / sPrice) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (pPrice < 0 || sPrice < 0) {
      setError('Prices cannot be negative.');
      return;
    }

    if (sPrice < pPrice) {
      const confirmLoss = window.confirm(
        'Warning: The sale price is lower than purchase cost (selling at a loss). Continue?'
      );
      if (!confirmLoss) return;
    }

    setSubmitting(true);

    try {
      const finalCategory = category === 'Other' && customCategory ? customCategory : category;

      const productPayload = {
        name: name.trim(),
        code: code.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        barcode: barcode.trim(),
        category: finalCategory || 'General',
        unit: unit.trim() || 'pcs',
        purchasePrice: pPrice,
        salePrice: sPrice,
        quantity: Number(quantity) || 0,
        lowStockThreshold: Number(lowStockThreshold) || 5,
        description: description.trim(),
      };

      if (isEditing && product) {
        await updateProduct(product.id, productPayload);
      } else {
        await addProduct(productPayload);
      }

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold">
              {isEditing ? 'Edit Product Details' : 'Add New Retail Product'}
            </h3>
            <p className="text-xs text-slate-400">
              Enter SKU, cost, retail sale price, and stock quantities
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 mx-4 mt-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Product Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tapal Danedar Tea 430g"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* SKU & Barcode */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Product Code / SKU
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. TEA-TAP-430"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Barcode</label>
                <button
                  type="button"
                  onClick={handleGenerateBarcode}
                  className="text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Barcode className="w-3 h-3" /> Auto Gen
                </button>
              </div>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="896400010012"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {existingCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">+ New Custom Category</option>
              </select>
              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter Category Name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full mt-2 px-3 py-1.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Unit</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="pack">Pack</option>
                <option value="carton">Carton</option>
                <option value="box">Box</option>
                <option value="bottle">Bottle</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="litre">Litre (L)</option>
                <option value="strip">Tablet Strip</option>
                <option value="bag">Bag</option>
              </select>
            </div>
          </div>

          {/* Pricing: Purchase Cost & Sale Price */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Purchase Cost Price ({settings.currencySymbol || 'Rs.'}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={purchasePrice}
                  onChange={(e) =>
                    setPurchasePrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="580"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Retail Sale Price ({settings.currencySymbol || 'Rs.'}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={salePrice}
                  onChange={(e) =>
                    setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="650"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Profit Margin Preview Card */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
              <span className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Estimated Profit:
              </span>
              <div className="font-mono text-right">
                <span
                  className={`font-black ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                >
                  {formatCurrency(profit, settings.currencySymbol)}
                </span>
                <span className="text-[11px] text-slate-500 ml-1.5 font-semibold">
                  ({marginPercent.toFixed(1)}% markup)
                </span>
              </div>
            </div>
          </div>

          {/* Stock Quantities & Low Stock Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                In-Stock Quantity *
              </label>
              <input
                type="number"
                required
                min="0"
                value={quantity}
                onChange={(e) =>
                  setQuantity(e.target.value === '' ? '' : parseInt(e.target.value) || 0)
                }
                placeholder="24"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Low Stock Warning Level
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={(e) =>
                  setLowStockThreshold(e.target.value === '' ? '' : parseInt(e.target.value) || 1)
                }
                placeholder="5"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Original packaging from distributor"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
