import { useCallback, useEffect, useState } from 'react';
import { AdminLogin } from './components/AdminLogin';
import { AiInsightsView } from './components/AiInsightsView';
import { AppShell } from './components/AppShell';
import { InventoryChatbot } from './components/InventoryChatbot';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductFormModal } from './components/ProductFormModal';
import { ReportsView } from './components/ReportsView';
import { StockTransactionModal } from './components/StockTransactionModal';
import { SuppliersView } from './components/SuppliersView';
import { ToastContainer } from './components/ToastContainer';
import { TransactionsView } from './components/TransactionsView';
import {
  createSeedProducts,
  createSeedPurchaseOrders,
  createSeedSuppliers,
  createSeedTransactions,
  formatIsoDateOffset,
} from './data/seedData';
import {
  ActiveScreen,
  ChatProposedAction,
  DateRangeDays,
  Product,
  PurchaseOrder,
  StockTransaction,
  Supplier,
  ToastMessage,
  TransactionType,
  UserSession,
} from './types/inventory';

const STORAGE_KEY = 'smartstock_ai_demo_state_v1';
const SESSION_KEY = 'smartstock_ai_demo_session_v1';

interface PersistedState {
  products: Product[];
  suppliers: Supplier[];
  transactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.suppliers) &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.purchaseOrders)
      ) {
        return {
          products: parsed.products,
          suppliers: parsed.suppliers,
          transactions: parsed.transactions,
          purchaseOrders: parsed.purchaseOrders,
        };
      }
    }
  } catch {
    // Fallback cleanly to deterministic seed data
  }

  return {
    products: createSeedProducts(),
    suppliers: createSeedSuppliers(),
    transactions: createSeedTransactions(),
    purchaseOrders: createSeedPurchaseOrders(),
  };
}

function loadInitialSession(): UserSession | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      return {
        email: 'admin@smartstock.demo',
        name: 'Clara Vance',
        role: 'Operations Admin (Demo)',
        rememberMe: true,
        isDemo: true,
      };
    }
  }

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw) as UserSession;
  } catch {
    // Ignore storage read issues
  }
  return null;
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => loadInitialSession());
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('overview');
  const [globalSearch, setGlobalSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeDays>(30);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals & Drawers
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockModalProductId, setStockModalProductId] = useState<string | undefined>(undefined);
  const [stockModalType, setStockModalType] = useState<TransactionType>('stock_in');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSignIn = (nextSession: UserSession) => {
    setSession(nextSession);
    if (nextSession.rememberMe) {
      try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      } catch {
        // Ignore storage error
      }
    }
    addToast('success', 'Signed in to SmartStock AI', 'Loaded Northwind Pantry & Brew Co. demo data.');
  };

  const handleSignOut = () => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // Ignore storage error
    }
    setActiveScreen('overview');
  };

  const handleResetDemoData = () => {
    const fresh: PersistedState = {
      products: createSeedProducts(),
      suppliers: createSeedSuppliers(),
      transactions: createSeedTransactions(),
      purchaseOrders: createSeedPurchaseOrders(),
    };
    setState(fresh);
    addToast('info', 'Sample data restored', 'Products, suppliers, and transactions reset to defaults.');
  };

  // Product Handlers
  const handleSaveProduct = (
    productData: Omit<Product, 'id' | 'updatedAt'>,
    editingId?: string
  ) => {
    const today = formatIsoDateOffset(0);
    if (editingId) {
      setState((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === editingId ? { ...p, ...productData, updatedAt: today } : p
        ),
      }));
      addToast('success', 'Product updated', `${productData.name} (${productData.sku}) saved.`);
    } else {
      const newProduct: Product = {
        ...productData,
        id: `prod-${Date.now()}`,
        updatedAt: today,
      };
      setState((prev) => ({
        ...prev,
        products: [newProduct, ...prev.products],
      }));
      addToast('success', 'Product added', `${newProduct.name} added to catalog.`);
    }
    setProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    const target = state.products.find((p) => p.id === productId);
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
    if (target) {
      addToast('success', 'Product deleted', `${target.name} removed from catalog.`);
    }
  };

  // Stock Transaction Handler
  const handleConfirmStockTransaction = (payload: {
    productId: string;
    type: TransactionType;
    quantity: number;
    date: string;
    counterparty: string;
    note: string;
  }) => {
    const product = state.products.find((p) => p.id === payload.productId);
    if (!product) return;

    const previousStock = product.quantity;
    const resultingStock =
      payload.type === 'stock_in'
        ? previousStock + payload.quantity
        : previousStock - payload.quantity;

    if (resultingStock < 0) {
      addToast('error', 'Insufficient stock', 'Cannot dispatch more units than available.');
      return;
    }

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      type: payload.type,
      quantityChange: payload.quantity,
      previousStock,
      resultingStock,
      date: payload.date,
      counterparty: payload.counterparty,
      note: payload.note || undefined,
      user: session?.name ?? 'Clara Vance',
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === product.id ? { ...p, quantity: resultingStock, updatedAt: payload.date } : p
      ),
      transactions: [newTx, ...prev.transactions],
    }));

    setStockModalOpen(false);
    addToast(
      'success',
      payload.type === 'stock_in' ? 'Stock received' : 'Stock dispatched',
      `${product.name}: ${previousStock} → ${resultingStock} units.`
    );
  };

  // Purchase Order Handler
  const handleCreatePurchaseOrder = (product: Product, customQty?: number) => {
    const supplier = state.suppliers.find((s) => s.id === product.supplierId);
    const qty = customQty ?? Math.max(15, product.reorderPoint * 2 - product.quantity);
    const nextNum = 107 + state.purchaseOrders.length;
    const etaDays = supplier?.leadTimeDays ?? 5;
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${nextNum}`,
      supplierId: product.supplierId,
      supplierName: supplier?.companyName ?? 'Primary Supplier',
      productId: product.id,
      productName: product.name,
      quantity: qty,
      estimatedCost: Number((qty * product.unitCost).toFixed(2)),
      expectedDate: formatIsoDateOffset(etaDays),
      status: 'Pending',
      createdAt: formatIsoDateOffset(0),
    };

    setState((prev) => ({
      ...prev,
      purchaseOrders: [newPo, ...prev.purchaseOrders],
    }));

    addToast(
      'success',
      `Purchase order ${newPo.poNumber} created`,
      `${qty} units of ${product.name} ordered from ${newPo.supplierName}.`
    );
  };

  // Supplier Handlers
  const handleSaveSupplier = (data: Omit<Supplier, 'id'>, editingId?: string) => {
    if (editingId) {
      setState((prev) => ({
        ...prev,
        suppliers: prev.suppliers.map((s) => (s.id === editingId ? { ...s, ...data } : s)),
      }));
      addToast('success', 'Supplier updated', `${data.companyName} details saved.`);
    } else {
      const newSup: Supplier = { ...data, id: `sup-${Date.now()}` };
      setState((prev) => ({
        ...prev,
        suppliers: [newSup, ...prev.suppliers],
      }));
      addToast('success', 'Supplier added', `${newSup.companyName} added to vendor directory.`);
    }
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const target = state.suppliers.find((s) => s.id === supplierId);
    setState((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((s) => s.id !== supplierId),
    }));
    if (target) {
      addToast('success', 'Supplier deleted', `${target.companyName} removed.`);
    }
  };

  const handleConfirmChatAction = (action: ChatProposedAction) => {
    const product = state.products.find((p) => p.id === action.productId);
    if (product) {
      handleCreatePurchaseOrder(product, action.quantity);
    }
  };

  if (!session) {
    return (
      <>
        <AdminLogin onSignIn={handleSignIn} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <>
      <AppShell
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        session={session}
        onSignOut={handleSignOut}
        onResetDemoData={handleResetDemoData}
        globalSearch={globalSearch}
        onGlobalSearchChange={setGlobalSearch}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        products={state.products}
        purchaseOrders={state.purchaseOrders}
        onOpenChat={() => setChatOpen(true)}
      >
        {activeScreen === 'overview' && (
          <OverviewDashboard
            products={state.products}
            transactions={state.transactions}
            purchaseOrders={state.purchaseOrders}
            suppliers={state.suppliers}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onNavigate={setActiveScreen}
            onOpenStockModal={(productId, type = 'stock_in') => {
              setStockModalProductId(productId);
              setStockModalType(type);
              setStockModalOpen(true);
            }}
            onCreatePurchaseOrder={(product) => handleCreatePurchaseOrder(product)}
            onOpenChat={() => setChatOpen(true)}
          />
        )}

        {activeScreen === 'products' && (
          <ProductCatalog
            products={state.products}
            suppliers={state.suppliers}
            globalSearch={globalSearch}
            onAddProduct={() => {
              setEditingProduct(null);
              setProductModalOpen(true);
            }}
            onEditProduct={(product) => {
              setEditingProduct(product);
              setProductModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onOpenStockModal={(productId, type) => {
              setStockModalProductId(productId);
              setStockModalType(type);
              setStockModalOpen(true);
            }}
          />
        )}

        {activeScreen === 'transactions' && (
          <TransactionsView
            transactions={state.transactions}
            onOpenStockModal={(productId, type = 'stock_in') => {
              setStockModalProductId(productId);
              setStockModalType(type);
              setStockModalOpen(true);
            }}
          />
        )}

        {activeScreen === 'suppliers' && (
          <SuppliersView
            suppliers={state.suppliers}
            products={state.products}
            purchaseOrders={state.purchaseOrders}
            transactions={state.transactions}
            onSaveSupplier={handleSaveSupplier}
            onDeleteSupplier={handleDeleteSupplier}
          />
        )}

        {activeScreen === 'reports' && (
          <ReportsView
            products={state.products}
            transactions={state.transactions}
            suppliers={state.suppliers}
            onExportSuccess={(filename) =>
              addToast('success', 'Report exported', `Downloaded ${filename}.`)
            }
          />
        )}

        {activeScreen === 'insights' && (
          <AiInsightsView
            products={state.products}
            transactions={state.transactions}
            suppliers={state.suppliers}
            purchaseOrders={state.purchaseOrders}
            onCreatePurchaseOrder={(product, qty) => handleCreatePurchaseOrder(product, qty)}
            onOpenChat={() => setChatOpen(true)}
          />
        )}
      </AppShell>

      <ProductFormModal
        open={productModalOpen}
        editingProduct={editingProduct}
        products={state.products}
        suppliers={state.suppliers}
        onSave={handleSaveProduct}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
      />

      <StockTransactionModal
        open={stockModalOpen}
        products={state.products}
        suppliers={state.suppliers}
        initialProductId={stockModalProductId}
        initialType={stockModalType}
        onConfirm={handleConfirmStockTransaction}
        onClose={() => setStockModalOpen(false)}
      />

      <InventoryChatbot
        open={chatOpen}
        products={state.products}
        transactions={state.transactions}
        suppliers={state.suppliers}
        purchaseOrders={state.purchaseOrders}
        onClose={() => setChatOpen(false)}
        onConfirmProposedAction={handleConfirmChatAction}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
