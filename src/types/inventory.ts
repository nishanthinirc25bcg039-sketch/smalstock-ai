export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type TransactionType = 'stock_in' | 'stock_out';

export type SupplierDeliveryStatus = 'On Schedule' | 'In Transit' | 'Delayed';

export type PurchaseOrderStatus = 'Pending' | 'In Transit' | 'Received';

export type ActiveScreen =
  | 'overview'
  | 'products'
  | 'transactions'
  | 'suppliers'
  | 'reports'
  | 'insights';

export type DateRangeDays = 7 | 30 | 90;

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  supplierId: string;
  unitCost: number;
  sellingPrice: number;
  quantity: number;
  reorderPoint: number;
  imageUrl?: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  deliveryStatus: SupplierDeliveryStatus;
  leadTimeDays: number;
  address: string;
  notes?: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: TransactionType;
  quantityChange: number;
  previousStock: number;
  resultingStock: number;
  date: string; // YYYY-MM-DD
  counterparty: string; // Supplier or destination
  note?: string;
  user: string;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  estimatedCost: number;
  expectedDate: string; // YYYY-MM-DD
  status: PurchaseOrderStatus;
  createdAt: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface UserSession {
  email: string;
  name: string;
  role: string;
  rememberMe: boolean;
  isDemo: boolean;
}

export interface ProductFilters {
  search: string;
  category: string;
  supplierId: string;
  status: 'all' | StockStatus;
  sortBy: 'name_asc' | 'qty_asc' | 'qty_desc' | 'value_desc' | 'cost_desc';
}

export interface AiRecommendation {
  productId: string;
  productName: string;
  sku: string;
  currentQty: number;
  reorderPoint: number;
  dailyVelocity: number;
  daysOfCover: number | null;
  trendDirection: 'rising' | 'falling' | 'steady';
  trendPercent: number;
  suggestedReorderQty: number;
  estimatedOrderCost: number;
  confidenceLabel: 'High confidence' | 'Medium confidence' | 'Illustrative estimate';
  rationale: string;
  supplierId: string;
  supplierName: string;
}

export interface AiDailySummary {
  headline: string;
  generatedAtLabel: string;
  highlights: string[];
  recommendedActions: string[];
  isSampleData: boolean;
}

export interface ChatProposedAction {
  kind: 'create_po' | 'open_stock_in';
  label: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  quantity: number;
  estimatedCost: number;
  confirmed?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isGuidanceOnly?: boolean;
  proposedAction?: ChatProposedAction;
}
