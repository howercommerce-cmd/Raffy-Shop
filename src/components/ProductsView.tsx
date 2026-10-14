import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  Package,
  Barcode,
  Check,
  TrendingUp,
  Boxes,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { Product } from '../types';
import { formatCurrency } from '../utils/format';

interface ProductsViewProps {
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onAdjustStock: (product: Product) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  onOpenAddModal,
  onEditProduct,
  onAdjustStock,
}) => {
  const { products, deleteProduct, settings, seedDemoProducts } = useShop();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'Low' | 'Out' | 'Healthy'>('All');
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return products.filter((p) => {
      // Category filter
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;

      // Stock status filter
      const threshold = p.lowStockThreshold ?? 5;
      if (stockStatusFilter === 'Out' && p.quantity > 0) return false;
      if (stockStatusFilter === 'Low' && (p.quantity <= 0 || p.quantity > threshold)) return false;
      if (stockStatusFilter === 'Healthy' && p.quantity <= threshold) return false;

      // Search query
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, categoryFilter, stockStatusFilter]);

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setProductToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (products.length === 0) return;
    const headers = ['Name', 'SKU/Code', 'Barcode', 'Category', 'Purchase Price', 'Sale Price', 'Quantity', 'Unit', 'Low Stock Alert'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.code || ''}"`,
      `"${p.barcode || ''}"`,
      `"${p.category || ''}"`,
      p.purchasePrice,
      p.salePrice,
      p.quantity,
      `"${p.unit || 'pcs'}"`,
      p.lowStockThreshold,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `shop_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, barcode or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="py-2 px-3 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="All">All Stock Levels</option>
            <option value="Low">Low Stock Alerts Only</option>
            <option value="Out">Out of Stock (0)</option>
            <option value="Healthy">Healthy Stock</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={products.length === 0}
            className="p-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 transition cursor-pointer"
            title="Export Products CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Add Product Button */}
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">No products found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {products.length === 0
                ? 'Your inventory catalogue has no products yet. Add your first item or load starter demo stock.'
                : 'Try adjusting your search query or filters to find products.'}
            </p>
            {products.length === 0 && (
              <div className="mt-4 flex justify-center gap-3">
                <button
                  onClick={seedDemoProducts}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  ⚡ Load Sample Retail Catalog
                </button>
                <button
                  onClick={onOpenAddModal}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition"
                >
                  + Add First Product
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">SKU / Barcode</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Sale Price</th>
                  <th className="py-3 px-3 text-right">Profit Margin</th>
                  <th className="py-3 px-3 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const profit = p.salePrice - p.purchasePrice;
                  const marginPercent = p.salePrice > 0 ? (profit / p.salePrice) * 100 : 0;
                  const threshold = p.lowStockThreshold ?? 5;
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= threshold;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block leading-tight">{p.name}</span>
                        {p.description && (
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                            {p.description}
                          </span>
                        )}
                      </td>

                      {/* Code / Barcode */}
                      <td className="py-3 px-3 font-mono">
                        <span className="font-semibold text-slate-700 block">{p.code}</span>
                        {p.barcode && (
                          <span className="text-[10px] text-slate-400 block">{p.barcode}</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {p.category || 'General'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                        {formatCurrency(p.purchasePrice, settings.currencySymbol)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.salePrice, settings.currencySymbol)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        <span className="font-bold text-emerald-700 block">
                          +{formatCurrency(profit, settings.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold block">
                          ({marginPercent.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border">
                          {isOutOfStock ? (
                            <span className="text-rose-700 bg-rose-50 border-rose-200 px-2 py-0.5 rounded-full">
                              0 {p.unit || 'pcs'} (Out)
                            </span>
                          ) : isLowStock ? (
                            <span className="text-amber-800 bg-amber-50 border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              {p.quantity} {p.unit || 'pcs'}
                            </span>
                          ) : (
                            <span className="text-emerald-800 bg-emerald-50 border-emerald-200 px-2 py-0.5 rounded-full">
                              {p.quantity} {p.unit || 'pcs'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onAdjustStock(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Adjust Stock"
                          >
                            <Boxes className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onEditProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Edit Product"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setProductToDelete(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Table Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
          </span>
          <span className="font-mono text-[11px]">
            Total Units in Stock:{' '}
            <strong className="text-slate-800">
              {products.reduce((acc, p) => acc + (p.quantity || 0), 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 mt-1">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">"{productToDelete.name}"</strong>? This will remove
              it from the active product catalog.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
