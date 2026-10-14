import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  User,
  CreditCard,
  Printer,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Tag,
  Phone,
  FileText,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { formatCurrency } from '../utils/format';
import { Product, SaleItem, PaymentMethod, Sale, Customer } from '../types';

interface POSViewProps {
  onSaleCompleted: (sale: Sale, printType: 'thermal' | 'a4') => void;
  onOpenAddProductModal: () => void;
}

export const POSView: React.FC<POSViewProps> = ({
  onSaleCompleted,
  onOpenAddProductModal,
}) => {
  const { products, customers, completeSale, settings, addCustomer } = useShop();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Customer State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');

  // Billing & Payment State
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Processing & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery, selectedCategory]);

  // Add product to cart helper
  const handleAddToCart = (product: Product) => {
    setErrorMessage(null);

    // Hard stock check
    if (product.quantity <= 0) {
      setErrorMessage(`Cannot add "${product.name}" - Out of stock (0 available).`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          setErrorMessage(
            `Cannot add more "${product.name}". Only ${product.quantity} ${product.unit || 'pcs'} in stock.`
          );
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.salePrice - item.discount,
                costTotal: (item.quantity + 1) * item.purchasePrice,
              }
            : item
        );
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          name: product.name,
          code: product.code,
          barcode: product.barcode,
          quantity: 1,
          salePrice: product.salePrice,
          purchasePrice: product.purchasePrice,
          discount: 0,
          subtotal: product.salePrice,
          costTotal: product.purchasePrice,
        };
        return [...prev, newItem];
      }
    });
  };

  // Barcode / Enter key search handler (adds exact match on Enter)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      // Exact barcode or SKU match
      const exactMatch = products.find(
        (p) =>
          p.barcode?.toLowerCase() === q ||
          p.code.toLowerCase() === q ||
          p.name.toLowerCase() === q
      );

      if (exactMatch) {
        handleAddToCart(exactMatch);
        setSearchQuery('');
      } else if (filteredProducts.length === 1) {
        handleAddToCart(filteredProducts[0]);
        setSearchQuery('');
      }
    }
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    const prod = products.find((p) => p.id === productId);

    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    if (prod && newQty > prod.quantity) {
      setErrorMessage(
        `Quantity cannot exceed available stock (${prod.quantity} ${prod.unit || 'pcs'}).`
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.salePrice - item.discount,
            costTotal: newQty * item.purchasePrice,
          };
        }
        return item;
      })
    );
  };

  // Remove item from cart
  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Are you sure you want to clear this bill?')) {
      setCart([]);
      setDiscountValue(0);
      setPaidAmount('');
      setOrderNotes('');
      setErrorMessage(null);
    }
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity * item.salePrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return (subtotal * Math.min(100, Math.max(0, discountValue))) / 100;
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const netTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Actual amount paid by customer (if empty, defaults to netTotal)
  const effectivePaidAmount = useMemo(() => {
    if (paidAmount === '' || paidAmount === null || isNaN(Number(paidAmount))) {
      return netTotal;
    }
    return Number(paidAmount);
  }, [paidAmount, netTotal]);

  const changeToReturn = useMemo(() => {
    return effectivePaidAmount > netTotal ? effectivePaidAmount - netTotal : 0;
  }, [effectivePaidAmount, netTotal]);

  const balanceDue = useMemo(() => {
    return effectivePaidAmount < netTotal ? netTotal - effectivePaidAmount : 0;
  }, [effectivePaidAmount, netTotal]);

  // Select customer from saved list
  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    setSelectedCustomerId(custId);
    if (!custId) {
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      return;
    }
    const found = customers.find((c) => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerPhone(found.phone || '');
    }
  };

  // Quick Add customer modal submission
  const handleCreateNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    try {
      const newId = await addCustomer({
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
      });
      setSelectedCustomerId(newId);
      setCustomerName(newCustName.trim());
      setCustomerPhone(newCustPhone.trim());
      setShowNewCustomerModal(false);
      setNewCustName('');
      setNewCustPhone('');
    } catch (err) {
      console.error('Failed to create customer:', err);
    }
  };

  // Checkout submission
  const handleCheckout = async (printType: 'thermal' | 'a4') => {
    if (cart.length === 0) {
      setErrorMessage('Please add at least one product to the bill.');
      return;
    }

    // Verify customer selected if balance is due (Khata)
    if (balanceDue > 0 && customerName === 'Walk-in Customer' && !selectedCustomerId) {
      setErrorMessage(
        'Outstanding balance (credit) requires selecting or entering a customer name for Khata ledger.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const completedSale = await completeSale({
        items: cart,
        customerId: selectedCustomerId || undefined,
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || undefined,
        subtotal,
        discountAmount,
        totalAmount: netTotal,
        paidAmount: Math.min(effectivePaidAmount, netTotal), // capped to total for ledger
        balanceDue,
        paymentMethod,
        notes: orderNotes || undefined,
      });

      // Clear bill
      setCart([]);
      setDiscountValue(0);
      setPaidAmount('');
      setOrderNotes('');
      setSelectedCustomerId('');
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');

      // Open Print Modal
      onSaleCompleted(completedSale, printType);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to complete sale';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-6rem)]">
      {/* LEFT SECTION (Col 1-7): Product Search & Catalog */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Top Search & Filter Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode, enter SKU or search product name... (Press Enter to add)"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-2xs"
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

            <button
              onClick={onOpenAddProductModal}
              className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition cursor-pointer"
              title="Add New Product to Store"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid */}
        <div className="flex-1 p-3.5 overflow-y-auto">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <ShoppingCart className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No products found</p>
              <p className="text-xs text-slate-400 mt-1">
                {products.length === 0
                  ? 'Your product catalogue is empty. Add products to begin.'
                  : `No items matched "${searchQuery}"`}
              </p>
              {products.length === 0 && (
                <button
                  onClick={onOpenAddProductModal}
                  className="mt-3 px-3.5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700"
                >
                  + Add First Product
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.quantity <= 0;
                const isLowStock = p.quantity > 0 && p.quantity <= (p.lowStockThreshold ?? 5);

                return (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    disabled={isOutOfStock}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between group cursor-pointer relative ${
                      isOutOfStock
                        ? 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-emerald-500 hover:shadow-md'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 truncate block">
                          {p.code}
                        </span>
                        {/* Stock status pill */}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 font-mono ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isOutOfStock ? '0' : p.quantity} {p.unit || 'pcs'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 font-mono">
                        {formatCurrency(p.salePrice, settings.currencySymbol)}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center text-slate-500 transition-colors">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION (Col 8-12): Billing Cart & Checkout Terminal */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">Current Bill</h3>
            <span className="text-[11px] font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          <button
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className="text-xs text-slate-400 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-400 flex items-center gap-1 cursor-pointer transition"
            title="Clear Current Bill"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Customer Selector / Walk-in */}
        <div className="p-3 border-b border-slate-200 bg-slate-50/80 flex items-center gap-2 text-xs">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedCustomerId}
            onChange={handleCustomerSelect}
            className="flex-1 py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-slate-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Walk-in Customer (Cash Sale)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {c.phone ? `(${c.phone})` : ''}{' '}
                {c.outstandingBalance > 0 ? `• Due: Rs. ${Math.round(c.outstandingBalance)}` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg shrink-0 cursor-pointer"
            title="Add New Customer"
          >
            + New
          </button>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-2.5 mx-3 mt-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="font-bold text-rose-400">
              ✕
            </button>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 p-3 overflow-y-auto divide-y divide-slate-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingCart className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
              <p className="text-xs font-semibold text-slate-600">Bill is empty</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan or click any product on the left to add items.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0">
                  <h5 className="font-bold text-slate-900 truncate leading-tight">{item.name}</h5>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {formatCurrency(item.salePrice, settings.currencySymbol)} each
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                    className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateQuantity(item.productId, parseInt(e.target.value) || 0)
                    }
                    className="w-10 text-center text-xs font-mono font-bold bg-transparent focus:outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                    className="w-6 h-6 rounded bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-right shrink-0 w-20">
                  <span className="font-mono font-black text-slate-900 block">
                    {formatCurrency(item.subtotal, settings.currencySymbol)}
                  </span>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-[10px] text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Tender Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/80 space-y-2.5">
          {/* Subtotal & Discount Row */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(subtotal, settings.currencySymbol)}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-600">Discount:</span>
              <div className="flex items-center gap-1.5">
                <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      discountType === 'fixed' ? 'bg-slate-800 text-white' : 'text-slate-600'
                    }`}
                  >
                    Rs.
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      discountType === 'percent' ? 'bg-slate-800 text-white' : 'text-slate-600'
                    }`}
                  >
                    %
                  </button>
                </div>
                <input
                  type="number"
                  value={discountValue || ''}
                  onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="font-mono text-rose-600 font-bold w-16 text-right">
                  -{formatCurrency(discountAmount, settings.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Net Total */}
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Net Payable:</span>
              <span className="font-mono text-emerald-700">
                {formatCurrency(netTotal, settings.currencySymbol)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="pt-2 border-t border-slate-200/80">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Payment Method
            </label>
            <div className="grid grid-cols-5 gap-1 text-[11px]">
              {(['Cash', 'JazzCash', 'Easypaisa', 'Bank Transfer', 'Other'] as PaymentMethod[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1 px-1 rounded-lg font-bold text-center border transition-all cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {m === 'Bank Transfer' ? 'Bank' : m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Cash Tender / Amount Paid & Change Return */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                Amount Paid ({settings.currencySymbol || 'Rs.'})
              </label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder={String(netTotal)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              {changeToReturn > 0 ? (
                <div>
                  <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-0.5">
                    Change to Return
                  </label>
                  <div className="px-2.5 py-1.5 bg-emerald-100/60 border border-emerald-200 rounded-lg font-mono font-black text-emerald-800">
                    {formatCurrency(changeToReturn, settings.currencySymbol)}
                  </div>
                </div>
              ) : balanceDue > 0 ? (
                <div>
                  <label className="text-[10px] font-bold text-rose-600 uppercase block mb-0.5">
                    Credit / Khata Balance
                  </label>
                  <div className="px-2.5 py-1.5 bg-rose-100/60 border border-rose-200 rounded-lg font-mono font-black text-rose-700">
                    {formatCurrency(balanceDue, settings.currencySymbol)}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                    Balance
                  </label>
                  <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg font-mono text-slate-500">
                    {settings.currencySymbol} 0 (Full Paid)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Cash Tender Presets */}
          <div className="flex items-center gap-1 text-[10px]">
            <span className="text-slate-400">Quick tender:</span>
            <button
              onClick={() => setPaidAmount(netTotal)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono hover:bg-slate-100 cursor-pointer"
            >
              Exact
            </button>
            <button
              onClick={() => setPaidAmount(500)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono hover:bg-slate-100 cursor-pointer"
            >
              500
            </button>
            <button
              onClick={() => setPaidAmount(1000)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono hover:bg-slate-100 cursor-pointer"
            >
              1000
            </button>
            <button
              onClick={() => setPaidAmount(5000)}
              className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono hover:bg-slate-100 cursor-pointer"
            >
              5000
            </button>
          </div>

          {/* Checkout Action Buttons */}
          <div className="pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleCheckout('thermal')}
              disabled={isSubmitting || cart.length === 0}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Saving Bill...</span>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt (Thermal)</span>
                </>
              )}
            </button>

            <button
              onClick={() => handleCheckout('a4')}
              disabled={isSubmitting || cart.length === 0}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md hover:shadow transition disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Save & A4 Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add New Customer</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter customer details for billing and Khata ledger.
            </p>

            <form onSubmit={handleCreateNewCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Haji Aslam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCustomerModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
