export type PaymentMethod = 'Cash' | 'JazzCash' | 'Easypaisa' | 'Bank Transfer' | 'Other';

export type SaleStatus = 'completed' | 'refunded' | 'cancelled';

export interface Product {
  id: string;
  ownerId: string;
  name: string;
  code: string; // SKU
  barcode: string;
  category: string;
  purchasePrice: number; // Cost Price
  salePrice: number;     // Retail Price
  quantity: number;      // Current in-stock
  lowStockThreshold: number; // Low stock alert level
  unit: string;          // pcs, kg, box, etc.
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  code: string;
  barcode?: string;
  quantity: number;
  salePrice: number;
  purchasePrice: number; // Snapshot of cost at sale moment
  discount: number;      // discount per unit or item total
  subtotal: number;      // quantity * salePrice - discount
  costTotal: number;     // quantity * purchasePrice
}

export interface Sale {
  id: string;
  ownerId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  totalCost: number;     // Cost of goods sold
  grossProfit: number;   // totalAmount - totalCost
  notes?: string;
  cancellationReason?: string;
  refundReason?: string;
  createdAt: string;     // ISO timestamp
  cashierName?: string;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number; // Udhar / Khata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  ownerId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'damage' | 'return';
  quantityDelta: number; // e.g. -2 for sale, +10 for purchase, -1 for damage
  newQuantity: number;
  reason?: string;
  referenceId?: string; // invoiceNumber or purchaseNumber
  createdAt: string;
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  id: string;
  ownerId: string;
  purchaseNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  items: PurchaseItem[];
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface CustomerPayment {
  id: string;
  ownerId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceSaleId?: string;
  notes?: string;
  createdAt: string;
}

export interface ShopSettings {
  id?: string;
  ownerId: string;
  shopName: string;
  shopLogo?: string;
  address: string;
  phone: string;
  receiptFooter: string;
  currency: string;        // e.g. "PKR"
  currencySymbol: string;  // e.g. "Rs."
  defaultLowStockThreshold: number;
  taxPercentage: number;
  invoicePrefix: string;   // e.g. "INV"
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  role: 'owner' | 'admin' | 'cashier';
  createdAt: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'customers'
  | 'suppliers'
  | 'purchases'
  | 'reports'
  | 'settings';
