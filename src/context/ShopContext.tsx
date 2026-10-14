import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  setDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Product,
  Sale,
  SaleItem,
  Customer,
  Supplier,
  Purchase,
  CustomerPayment,
  StockMovement,
  ShopSettings,
  PaymentMethod,
} from '../types';

interface ShopContextType {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  payments: CustomerPayment[];
  settings: ShopSettings;
  loadingData: boolean;
  
  // Actions
  completeSale: (saleInput: {
    items: SaleItem[];
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => Promise<Sale>;

  refundSale: (saleId: string, reason: string) => Promise<void>;
  cancelSale: (saleId: string, reason: string) => Promise<void>;

  addProduct: (product: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  adjustStock: (productId: string, newQuantity: number, reason: string, type: 'adjustment' | 'damage' | 'return') => Promise<void>;

  addPurchase: (purchaseInput: {
    purchaseNumber: string;
    supplierId?: string;
    supplierName: string;
    supplierPhone?: string;
    items: { productId: string; name: string; quantity: number; unitCost: number; totalCost: number }[];
    totalAmount: number;
    notes?: string;
  }) => Promise<void>;

  addCustomer: (customer: Omit<Customer, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>) => Promise<string>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  recordCustomerPayment: (customerId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => Promise<void>;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'ownerId' | 'createdAt'>) => Promise<string>;
  deleteSupplier: (id: string) => Promise<void>;

  updateSettings: (newSettings: Partial<ShopSettings>) => Promise<void>;
  seedDemoProducts: () => Promise<void>;

  // Derived Stats
  dashboardStats: {
    todaySales: number;
    todayBillsCount: number;
    todayProfit: number;
    totalProductsCount: number;
    lowStockCount: number;
    totalReceivables: number;
  };
}

const defaultSettings: ShopSettings = {
  ownerId: '',
  shopName: 'Bismillah General Store',
  address: 'Shop # 14, Commercial Market, Main Road, Lahore',
  phone: '0300-1234567',
  receiptFooter: 'Thank you for shopping with us! / سامان تبدیل یا واپس 7 دن کے اندر ہو سکتا ہے۔',
  currency: 'PKR',
  currencySymbol: 'Rs.',
  defaultLowStockThreshold: 5,
  taxPercentage: 0,
  invoicePrefix: 'INV',
  updatedAt: new Date().toISOString(),
};

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [loadingData, setLoadingData] = useState(true);

  // Set up real-time Firestore listeners when user is authenticated
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setSuppliers([]);
      setPurchases([]);
      setStockMovements([]);
      setPayments([]);
      setSettings(defaultSettings);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const userId = user.uid;

    // 1. Settings listener
    const settingsDocRef = doc(db, 'settings', userId);
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as ShopSettings);
        } else {
          // Initialize default shop settings for this owner
          const initialSettings: ShopSettings = {
            ...defaultSettings,
            ownerId: userId,
            updatedAt: new Date().toISOString(),
          };
          setDoc(settingsDocRef, initialSettings).catch((err) =>
            console.error('Failed to init settings:', err)
          );
          setSettings(initialSettings);
        }
      },
      (error) => handleFirestoreError(error, OperationType.GET, `settings/${userId}`)
    );

    // 2. Products listener
    const productsQuery = query(collection(db, 'products'), where('ownerId', '==', userId));
    const unsubProducts = onSnapshot(
      productsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
        // Sort in memory by name
        list.sort((a, b) => a.name.localeCompare(b.name));
        setProducts(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );

    // 3. Sales listener
    const salesQuery = query(collection(db, 'sales'), where('ownerId', '==', userId));
    const unsubSales = onSnapshot(
      salesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Sale));
        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSales(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'sales')
    );

    // 4. Customers listener
    const customersQuery = query(collection(db, 'customers'), where('ownerId', '==', userId));
    const unsubCustomers = onSnapshot(
      customersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
        list.sort((a, b) => a.name.localeCompare(b.name));
        setCustomers(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'customers')
    );

    // 5. Suppliers listener
    const suppliersQuery = query(collection(db, 'suppliers'), where('ownerId', '==', userId));
    const unsubSuppliers = onSnapshot(
      suppliersQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier));
        setSuppliers(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'suppliers')
    );

    // 6. Purchases listener
    const purchasesQuery = query(collection(db, 'purchases'), where('ownerId', '==', userId));
    const unsubPurchases = onSnapshot(
      purchasesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPurchases(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'purchases')
    );

    // 7. StockMovements listener
    const movementsQuery = query(collection(db, 'stockMovements'), where('ownerId', '==', userId));
    const unsubMovements = onSnapshot(
      movementsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as StockMovement));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setStockMovements(list.slice(0, 200));
        setLoadingData(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'stockMovements')
    );

    // 8. Payments listener
    const paymentsQuery = query(collection(db, 'payments'), where('ownerId', '==', userId));
    const unsubPayments = onSnapshot(
      paymentsQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CustomerPayment));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setPayments(list);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'payments')
    );

    return () => {
      unsubSettings();
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubSuppliers();
      unsubPurchases();
      unsubMovements();
      unsubPayments();
    };
  }, [user]);

  // Derived live dashboard stats calculated directly from verified database records
  const dashboardStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySalesList = sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const saleDate = new Date(s.createdAt);
      return saleDate >= today;
    });

    const todaySales = todaySalesList.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayBillsCount = todaySalesList.length;
    const todayProfit = todaySalesList.reduce((sum, s) => sum + s.grossProfit, 0);
    const totalProductsCount = products.length;
    const lowStockCount = products.filter((p) => p.quantity <= (p.lowStockThreshold ?? 5)).length;
    const totalReceivables = customers.reduce((sum, c) => sum + Math.max(0, c.outstandingBalance || 0), 0);

    return {
      todaySales,
      todayBillsCount,
      todayProfit,
      totalProductsCount,
      lowStockCount,
      totalReceivables,
    };
  }, [sales, products, customers]);

  // Atomic POS Sale Completion with stock validation and inventory deduction
  const completeSale = async (saleInput: {
    items: SaleItem[];
    customerName?: string;
    customerPhone?: string;
    customerId?: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    paymentMethod: PaymentMethod;
    notes?: string;
  }): Promise<Sale> => {
    if (!user) throw new Error('You must be signed in to complete a sale.');
    if (saleInput.items.length === 0) throw new Error('Cannot complete an empty bill.');

    const now = new Date();
    const dateStr = now.toISOString();
    // Unique invoice number e.g. INV-20261013-4819
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = settings.invoicePrefix || 'INV';
    const invoiceNumber = `${prefix}-${ymd}-${randomSuffix}`;

    // Calculate total cost and gross profit based on purchase price snapshot
    const totalCost = saleInput.items.reduce((sum, it) => sum + it.costTotal, 0);
    const grossProfit = saleInput.totalAmount - totalCost;

    const saleRef = doc(collection(db, 'sales'));
    const newSale: Sale = {
      id: saleRef.id,
      ownerId: user.uid,
      invoiceNumber,
      customerId: saleInput.customerId || '',
      customerName: saleInput.customerName || 'Walk-in Customer',
      customerPhone: saleInput.customerPhone || '',
      items: saleInput.items,
      subtotal: saleInput.subtotal,
      discountAmount: saleInput.discountAmount,
      totalAmount: saleInput.totalAmount,
      paidAmount: saleInput.paidAmount,
      balanceDue: saleInput.balanceDue,
      paymentMethod: saleInput.paymentMethod,
      status: 'completed',
      totalCost,
      grossProfit,
      notes: saleInput.notes || '',
      createdAt: dateStr,
      cashierName: user.displayName || 'Cashier',
    };

    // Run atomic transaction across Firestore to guarantee stock consistency
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Validate and read all products in the cart
        const productReads: { ref: any; currentData: Product; item: SaleItem }[] = [];
        for (const item of saleInput.items) {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists()) {
            throw new Error(`Product "${item.name}" no longer exists in database.`);
          }

          const currentProd = productSnap.data() as Product;
          if (currentProd.quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for "${item.name}". In stock: ${currentProd.quantity}, Requested: ${item.quantity}`
            );
          }

          productReads.push({ ref: productRef, currentData: currentProd, item });
        }

        // 2. Read customer doc if linked and balance is due
        let customerRef: any = null;
        let customerData: Customer | null = null;
        if (saleInput.customerId) {
          customerRef = doc(db, 'customers', saleInput.customerId);
          const custSnap = await transaction.get(customerRef);
          if (custSnap.exists()) {
            customerData = custSnap.data() as Customer;
          }
        }

        // 3. Perform Writes: Decrement product stocks
        for (const { ref, currentData, item } of productReads) {
          const newQty = currentData.quantity - item.quantity;
          transaction.update(ref, {
            quantity: newQty,
            updatedAt: dateStr,
          });

          // Create stock movement record
          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            ownerId: user.uid,
            productId: item.productId,
            productName: item.name,
            type: 'sale',
            quantityDelta: -item.quantity,
            newQuantity: newQty,
            referenceId: invoiceNumber,
            reason: `Sold on bill #${invoiceNumber}`,
            createdAt: dateStr,
          });
        }

        // 4. Update customer ledger if applicable
        if (customerRef && customerData) {
          transaction.update(customerRef, {
            totalPurchases: (customerData.totalPurchases || 0) + saleInput.totalAmount,
            totalPaid: (customerData.totalPaid || 0) + saleInput.paidAmount,
            outstandingBalance: (customerData.outstandingBalance || 0) + saleInput.balanceDue,
            updatedAt: dateStr,
          });
        }

        // 5. Save the completed Sale record
        transaction.set(saleRef, newSale);
      });

      return newSale;
    } catch (error) {
      console.error('Failed to complete transaction:', error);
      throw error;
    }
  };

  // Refund Sale: Return items to stock, adjust customer balance, mark as refunded
  const refundSale = async (saleId: string, reason: string) => {
    if (!user) throw new Error('Authentication required');
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'refunded') throw new Error('Sale is already refunded');

    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);
      const saleSnap = await transaction.get(saleRef);
      if (!saleSnap.exists()) throw new Error('Sale record not found');

      // Restore product stock
      for (const item of sale.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          const newQty = prodData.quantity + item.quantity;
          transaction.update(prodRef, {
            quantity: newQty,
            updatedAt: now,
          });

          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            ownerId: user.uid,
            productId: item.productId,
            productName: item.name,
            type: 'return',
            quantityDelta: item.quantity,
            newQuantity: newQty,
            referenceId: sale.invoiceNumber,
            reason: `Return/Refund on invoice #${sale.invoiceNumber}: ${reason}`,
            createdAt: now,
          });
        }
      }

      // Reverse customer debt if applicable
      if (sale.customerId && sale.balanceDue > 0) {
        const custRef = doc(db, 'customers', sale.customerId);
        const custSnap = await transaction.get(custRef);
        if (custSnap.exists()) {
          const custData = custSnap.data() as Customer;
          transaction.update(custRef, {
            outstandingBalance: Math.max(0, (custData.outstandingBalance || 0) - sale.balanceDue),
            totalPurchases: Math.max(0, (custData.totalPurchases || 0) - sale.totalAmount),
            updatedAt: now,
          });
        }
      }

      transaction.update(saleRef, {
        status: 'refunded',
        refundReason: reason,
        updatedAt: now,
      });
    });
  };

  // Cancel Sale: Audit reversal
  const cancelSale = async (saleId: string, reason: string) => {
    if (!user) throw new Error('Authentication required');
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) throw new Error('Sale not found');
    if (sale.status === 'cancelled') throw new Error('Sale is already cancelled');

    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const saleRef = doc(db, 'sales', saleId);

      // Restore items back to inventory
      for (const item of sale.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          const newQty = prodData.quantity + item.quantity;
          transaction.update(prodRef, {
            quantity: newQty,
            updatedAt: now,
          });

          const movementRef = doc(collection(db, 'stockMovements'));
          transaction.set(movementRef, {
            ownerId: user.uid,
            productId: item.productId,
            productName: item.name,
            type: 'return',
            quantityDelta: item.quantity,
            newQuantity: newQty,
            referenceId: sale.invoiceNumber,
            reason: `Cancelled bill #${sale.invoiceNumber}: ${reason}`,
            createdAt: now,
          });
        }
      }

      if (sale.customerId && sale.balanceDue > 0) {
        const custRef = doc(db, 'customers', sale.customerId);
        const custSnap = await transaction.get(custRef);
        if (custSnap.exists()) {
          const custData = custSnap.data() as Customer;
          transaction.update(custRef, {
            outstandingBalance: Math.max(0, (custData.outstandingBalance || 0) - sale.balanceDue),
            totalPurchases: Math.max(0, (custData.totalPurchases || 0) - sale.totalAmount),
            updatedAt: now,
          });
        }
      }

      transaction.update(saleRef, {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: now,
      });
    });
  };

  // Product CRUD
  const addProduct = async (productData: Omit<Product, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const docRef = doc(collection(db, 'products'));
    const fullProduct: Product = {
      ...productData,
      id: docRef.id,
      ownerId: user.uid,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, fullProduct);

    // Initial stock movement
    if (productData.quantity > 0) {
      await addDoc(collection(db, 'stockMovements'), {
        ownerId: user.uid,
        productId: docRef.id,
        productName: productData.name,
        type: 'adjustment',
        quantityDelta: productData.quantity,
        newQuantity: productData.quantity,
        reason: 'Initial opening stock entry',
        createdAt: now,
      });
    }

    return docRef.id;
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    if (!user) throw new Error('Authentication required');
    const prodRef = doc(db, 'products', id);
    const existing = products.find((p) => p.id === id);
    const now = new Date().toISOString();

    // Check if quantity changed manually
    if (existing && productData.quantity !== undefined && productData.quantity !== existing.quantity) {
      const delta = productData.quantity - existing.quantity;
      await addDoc(collection(db, 'stockMovements'), {
        ownerId: user.uid,
        productId: id,
        productName: productData.name || existing.name,
        type: 'adjustment',
        quantityDelta: delta,
        newQuantity: productData.quantity,
        reason: 'Manual product stock update in catalogue',
        createdAt: now,
      });
    }

    await setDoc(prodRef, { ...productData, updatedAt: now }, { merge: true });
  };

  const deleteProduct = async (id: string) => {
    if (!user) throw new Error('Authentication required');
    await deleteDoc(doc(db, 'products', id));
  };

  const adjustStock = async (
    productId: string,
    newQuantity: number,
    reason: string,
    type: 'adjustment' | 'damage' | 'return'
  ) => {
    if (!user) throw new Error('Authentication required');
    const existing = products.find((p) => p.id === productId);
    if (!existing) throw new Error('Product not found');

    const now = new Date().toISOString();
    const delta = newQuantity - existing.quantity;

    await setDoc(doc(db, 'products', productId), { quantity: newQuantity, updatedAt: now }, { merge: true });

    await addDoc(collection(db, 'stockMovements'), {
      ownerId: user.uid,
      productId,
      productName: existing.name,
      type,
      quantityDelta: delta,
      newQuantity,
      reason,
      createdAt: now,
    });
  };

  // Purchases & Restock
  const addPurchase = async (purchaseInput: {
    purchaseNumber: string;
    supplierId?: string;
    supplierName: string;
    supplierPhone?: string;
    items: { productId: string; name: string; quantity: number; unitCost: number; totalCost: number }[];
    totalAmount: number;
    notes?: string;
  }) => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const purchaseRef = doc(collection(db, 'purchases'));

      for (const item of purchaseInput.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data() as Product;
          const newQty = prodData.quantity + item.quantity;
          transaction.update(prodRef, {
            quantity: newQty,
            purchasePrice: item.unitCost, // update latest cost price
            updatedAt: now,
          });

          const movRef = doc(collection(db, 'stockMovements'));
          transaction.set(movRef, {
            ownerId: user.uid,
            productId: item.productId,
            productName: item.name,
            type: 'purchase',
            quantityDelta: item.quantity,
            newQuantity: newQty,
            referenceId: purchaseInput.purchaseNumber,
            reason: `Purchase stock received: #${purchaseInput.purchaseNumber} from ${purchaseInput.supplierName}`,
            createdAt: now,
          });
        }
      }

      transaction.set(purchaseRef, {
        ...purchaseInput,
        ownerId: user.uid,
        createdAt: now,
      });
    });
  };

  // Customers
  const addCustomer = async (
    cust: Omit<Customer, 'id' | 'ownerId' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'totalPaid' | 'outstandingBalance'>
  ) => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(collection(db, 'customers'));
    const now = new Date().toISOString();
    const newCust: Customer = {
      ...cust,
      id: docRef.id,
      ownerId: user.uid,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(docRef, newCust);
    return docRef.id;
  };

  const updateCustomer = async (id: string, cust: Partial<Customer>) => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    await setDoc(doc(db, 'customers', id), { ...cust, updatedAt: now }, { merge: true });
  };

  const recordCustomerPayment = async (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    if (!user) throw new Error('Authentication required');
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const now = new Date().toISOString();

    await runTransaction(db, async (transaction) => {
      const custRef = doc(db, 'customers', customerId);
      const custSnap = await transaction.get(custRef);
      if (!custSnap.exists()) throw new Error('Customer does not exist');
      const custData = custSnap.data() as Customer;

      const newPaid = (custData.totalPaid || 0) + amount;
      const newBal = Math.max(0, (custData.outstandingBalance || 0) - amount);

      transaction.update(custRef, {
        totalPaid: newPaid,
        outstandingBalance: newBal,
        updatedAt: now,
      });

      const paymentRef = doc(collection(db, 'payments'));
      transaction.set(paymentRef, {
        ownerId: user.uid,
        customerId,
        customerName: customer.name,
        amount,
        paymentMethod,
        notes: notes || 'Khata debt recovery payment',
        createdAt: now,
      });
    });
  };

  // Suppliers
  const addSupplier = async (supp: Omit<Supplier, 'id' | 'ownerId' | 'createdAt'>) => {
    if (!user) throw new Error('Authentication required');
    const docRef = doc(collection(db, 'suppliers'));
    const now = new Date().toISOString();
    await setDoc(docRef, { ...supp, id: docRef.id, ownerId: user.uid, createdAt: now });
    return docRef.id;
  };

  const deleteSupplier = async (id: string) => {
    if (!user) throw new Error('Authentication required');
    await deleteDoc(doc(db, 'suppliers', id));
  };

  // Settings
  const updateSettings = async (newSettings: Partial<ShopSettings>) => {
    if (!user) throw new Error('Authentication required');
    const now = new Date().toISOString();
    const updated = { ...settings, ...newSettings, updatedAt: now, ownerId: user.uid };
    await setDoc(doc(db, 'settings', user.uid), updated, { merge: true });
    setSettings(updated);
  };

  // Seed demo items for Pakistani retail shopkeeper convenience
  const seedDemoProducts = async () => {
    if (!user) return;
    const starterProducts = [
      { name: 'Tapal Danedar Tea 430g', code: 'TEA-TAP-430', barcode: '896400010012', category: 'Beverages', purchasePrice: 580, salePrice: 650, quantity: 24, lowStockThreshold: 5, unit: 'pack' },
      { name: 'Olpers Milk 1 Litre (Carton of 12)', code: 'MLK-OLP-1L', barcode: '896400020045', category: 'Dairy', purchasePrice: 3200, salePrice: 3600, quantity: 10, lowStockThreshold: 3, unit: 'carton' },
      { name: 'Olpers Milk 1 Litre Tetra Pack', code: 'MLK-OLP-SNG', barcode: '896400020052', category: 'Dairy', purchasePrice: 270, salePrice: 300, quantity: 45, lowStockThreshold: 10, unit: 'pack' },
      { name: 'Dalda Cooking Oil 5 Litre Can', code: 'OIL-DAL-5L', barcode: '896400030018', category: 'Cooking Oils', purchasePrice: 2450, salePrice: 2750, quantity: 15, lowStockThreshold: 4, unit: 'can' },
      { name: 'Super Kernel Basmati Rice 5kg', code: 'RIC-BAS-5KG', barcode: '896400040089', category: 'Grains & Rice', purchasePrice: 1750, salePrice: 2100, quantity: 30, lowStockThreshold: 5, unit: 'bag' },
      { name: 'Shan Biryani Masala 50g (Double)', code: 'SP-SHN-BRY', barcode: '896400050033', category: 'Spices', purchasePrice: 95, salePrice: 120, quantity: 60, lowStockThreshold: 12, unit: 'box' },
      { name: 'Rooh Afza 800ml Sharbat Bottle', code: 'ROOH-AFZ-800', barcode: '896400060010', category: 'Beverages', purchasePrice: 380, salePrice: 440, quantity: 18, lowStockThreshold: 4, unit: 'bottle' },
      { name: 'National Tomato Ketchup 800g Pouch', code: 'SAU-NAT-800', barcode: '896400070025', category: 'Sauces', purchasePrice: 310, salePrice: 370, quantity: 20, lowStockThreshold: 5, unit: 'pouch' },
      { name: 'Surf Excel Detergent Powder 1kg', code: 'DET-SRF-1KG', barcode: '896400080066', category: 'Household', purchasePrice: 520, salePrice: 590, quantity: 25, lowStockThreshold: 5, unit: 'pack' },
      { name: 'Lux Rose Soap 140g (Pack of 3)', code: 'SOP-LUX-3PK', barcode: '896400090044', category: 'Personal Care', purchasePrice: 280, salePrice: 340, quantity: 32, lowStockThreshold: 6, unit: 'pack' },
      { name: 'Lipton Yellow Label Tea 400g', code: 'TEA-LIP-400', barcode: '896400100077', category: 'Beverages', purchasePrice: 620, salePrice: 710, quantity: 4, lowStockThreshold: 5, unit: 'pack' },
      { name: 'Panadol Extra Tablets (Strip of 10)', code: 'MED-PAN-EXT', barcode: '896400110091', category: 'Pharmacy & General', purchasePrice: 30, salePrice: 40, quantity: 3, lowStockThreshold: 10, unit: 'strip' },
    ];

    for (const item of starterProducts) {
      await addProduct(item);
    }

    // Add demo customer
    await addCustomer({
      name: 'Haji Muhammad Aslam',
      phone: '0321-4567890',
      address: 'House 12, Street 3, Lahore',
      notes: 'Trusted regular neighborhood customer',
    });

    await addCustomer({
      name: 'Chaudhry Tariq Mehmood',
      phone: '0333-9876543',
      address: 'Main Bazar, Shop 4',
      notes: 'Weekly wholesale buyer',
    });

    // Add demo supplier
    await addSupplier({
      name: 'Lahore Wholesale Distributors',
      company: 'Al-Madina Food Supplies',
      phone: '0300-8451234',
      address: 'Akbari Mandi, Lahore',
      notes: 'Main grocery supplier',
    });
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        sales,
        customers,
        suppliers,
        purchases,
        stockMovements,
        payments,
        settings,
        loadingData,
        completeSale,
        refundSale,
        cancelSale,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,
        addPurchase,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        addSupplier,
        deleteSupplier,
        updateSettings,
        seedDemoProducts,
        dashboardStats,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
