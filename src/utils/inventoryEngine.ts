import {
  DateRangeDays,
  Product,
  ProductFilters,
  PurchaseOrder,
  StockStatus,
  StockTransaction,
  Supplier,
  TransactionType,
} from '../types/inventory';

export function getStockStatus(quantity: number, reorderPoint: number): StockStatus {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= reorderPoint) return 'low_stock';
  return 'in_stock';
}

export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case 'out_of_stock':
      return 'Out of Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'in_stock':
      return 'In Stock';
  }
}

export function computeDashboardMetrics(products: Product[], purchaseOrders: PurchaseOrder[]) {
  const totalProducts = products.length;
  const totalStockUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const inventoryValue = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
  const lowStockProducts = products.filter(
    (p) => getStockStatus(p.quantity, p.reorderPoint) !== 'in_stock'
  );
  const lowStockCount = lowStockProducts.length;
  const outOfStockCount = products.filter((p) => p.quantity <= 0).length;
  const pendingPoCount = purchaseOrders.filter((po) => po.status !== 'Received').length;

  return {
    totalProducts,
    totalStockUnits,
    inventoryValue,
    lowStockCount,
    outOfStockCount,
    pendingPoCount,
    lowStockProducts,
  };
}

export function filterAndSortProducts(products: Product[], filters: ProductFilters): Product[] {
  const q = filters.search.trim().toLowerCase();

  const filtered = products.filter((p) => {
    if (q) {
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchCat) return false;
    }
    if (filters.category !== 'all' && p.category !== filters.category) return false;
    if (filters.supplierId !== 'all' && p.supplierId !== filters.supplierId) return false;
    if (filters.status !== 'all') {
      const status = getStockStatus(p.quantity, p.reorderPoint);
      if (status !== filters.status) return false;
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (filters.sortBy) {
      case 'qty_asc':
        return a.quantity - b.quantity;
      case 'qty_desc':
        return b.quantity - a.quantity;
      case 'value_desc':
        return b.quantity * b.unitCost - a.quantity * a.unitCost;
      case 'cost_desc':
        return b.unitCost - a.unitCost;
      case 'name_asc':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return sorted;
}

export interface ProductInputValidation {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateProductInput(
  input: {
    name: string;
    sku: string;
    category: string;
    supplierId: string;
    unitCost: string | number;
    sellingPrice: string | number;
    quantity: string | number;
    reorderPoint: string | number;
  },
  existingProducts: Product[],
  editingProductId?: string
): ProductInputValidation {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) errors.name = 'Product name is required.';
  if (!input.sku.trim()) {
    errors.sku = 'SKU is required.';
  } else {
    const normalizedSku = input.sku.trim().toUpperCase();
    const duplicate = existingProducts.find(
      (p) => p.sku.toUpperCase() === normalizedSku && p.id !== editingProductId
    );
    if (duplicate) errors.sku = `SKU "${normalizedSku}" is already assigned to ${duplicate.name}.`;
  }

  if (!input.category.trim()) errors.category = 'Category is required.';
  if (!input.supplierId.trim()) errors.supplierId = 'Please select a supplier.';

  const unitCost = Number(input.unitCost);
  if (Number.isNaN(unitCost) || unitCost <= 0) {
    errors.unitCost = 'Unit cost must be greater than $0.00.';
  }

  const sellingPrice = Number(input.sellingPrice);
  if (Number.isNaN(sellingPrice) || sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than $0.00.';
  }

  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'Current quantity must be a whole number (0 or more).';
  }

  const reorderPoint = Number(input.reorderPoint);
  if (!Number.isInteger(reorderPoint) || reorderPoint < 0) {
    errors.reorderPoint = 'Reorder point must be a whole number (0 or more).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function previewStockAdjustment(
  currentQty: number,
  type: TransactionType,
  rawAmount: number
): { valid: boolean; resultingQty: number; error?: string } {
  if (!Number.isFinite(rawAmount) || !Number.isInteger(rawAmount) || rawAmount <= 0) {
    return {
      valid: false,
      resultingQty: currentQty,
      error: 'Enter a whole number greater than 0.',
    };
  }

  if (type === 'stock_out') {
    if (rawAmount > currentQty) {
      return {
        valid: false,
        resultingQty: currentQty,
        error: `Cannot remove ${rawAmount} units — only ${currentQty} available in stock.`,
      };
    }
    return {
      valid: true,
      resultingQty: currentQty - rawAmount,
    };
  }

  return {
    valid: true,
    resultingQty: currentQty + rawAmount,
  };
}

export interface MovementBucket {
  label: string;
  dateKey: string;
  stockIn: number;
  stockOut: number;
}

export function buildStockMovementSeries(
  transactions: StockTransaction[],
  days: DateRangeDays,
  referenceDate = new Date()
): MovementBucket[] {
  const ref = new Date(referenceDate);
  ref.setHours(23, 59, 59, 999);

  if (days === 7) {
    const buckets: MovementBucket[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ref);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      buckets.push({ label, dateKey: iso, stockIn: 0, stockOut: 0 });
    }
    for (const tx of transactions) {
      const bucket = buckets.find((b) => b.dateKey === tx.date);
      if (bucket) {
        if (tx.type === 'stock_in') bucket.stockIn += tx.quantityChange;
        else bucket.stockOut += tx.quantityChange;
      }
    }
    return buckets;
  }

  // Group into 6 even periods for 30D (5-day buckets) or 90D (15-day buckets)
  const bucketCount = 6;
  const spanDays = Math.floor(days / bucketCount);
  const buckets: { start: Date; end: Date; label: string; stockIn: number; stockOut: number }[] = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date(ref);
    end.setDate(end.getDate() - i * spanDays);
    const start = new Date(end);
    start.setDate(start.getDate() - (spanDays - 1));
    start.setHours(0, 0, 0, 0);
    const label = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    buckets.push({ start, end, label, stockIn: 0, stockOut: 0 });
  }

  for (const tx of transactions) {
    const txDate = new Date(`${tx.date}T12:00:00`);
    const bucket = buckets.find((b) => txDate >= b.start && txDate <= b.end);
    if (bucket) {
      if (tx.type === 'stock_in') bucket.stockIn += tx.quantityChange;
      else bucket.stockOut += tx.quantityChange;
    }
  }

  return buckets.map((b, idx) => ({
    label: b.label,
    dateKey: `bucket-${idx}`,
    stockIn: b.stockIn,
    stockOut: b.stockOut,
  }));
}

export interface CategoryValueBreakdown {
  category: string;
  productCount: number;
  units: number;
  costValue: number;
  retailValue: number;
}

export interface ProductPerformanceRow {
  productId: string;
  name: string;
  sku: string;
  category: string;
  unitsSold: number;
  unitsRestocked: number;
  estimatedRevenue: number;
  currentQty: number;
  reorderPoint: number;
  status: StockStatus;
}

export function buildReportData(
  products: Product[],
  transactions: StockTransaction[],
  suppliers: Supplier[],
  days: DateRangeDays,
  categoryFilter: string,
  referenceDate = new Date()
) {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);

  const filteredProducts =
    categoryFilter === 'all'
      ? products
      : products.filter((p) => p.category === categoryFilter);

  const productIds = new Set(filteredProducts.map((p) => p.id));

  const windowTransactions = transactions.filter((tx) => {
    if (!productIds.has(tx.productId)) return false;
    const txDate = new Date(`${tx.date}T12:00:00`);
    return txDate >= cutoff;
  });

  const categoryMap = new Map<string, CategoryValueBreakdown>();
  for (const p of filteredProducts) {
    const existing = categoryMap.get(p.category) ?? {
      category: p.category,
      productCount: 0,
      units: 0,
      costValue: 0,
      retailValue: 0,
    };
    existing.productCount += 1;
    existing.units += p.quantity;
    existing.costValue += p.quantity * p.unitCost;
    existing.retailValue += p.quantity * p.sellingPrice;
    categoryMap.set(p.category, existing);
  }

  const categoryBreakdown = Array.from(categoryMap.values()).sort(
    (a, b) => b.costValue - a.costValue
  );

  const performanceRows: ProductPerformanceRow[] = filteredProducts.map((p) => {
    const prodTxs = windowTransactions.filter((t) => t.productId === p.id);
    const unitsSold = prodTxs
      .filter((t) => t.type === 'stock_out')
      .reduce((s, t) => s + t.quantityChange, 0);
    const unitsRestocked = prodTxs
      .filter((t) => t.type === 'stock_in')
      .reduce((s, t) => s + t.quantityChange, 0);
    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitsSold,
      unitsRestocked,
      estimatedRevenue: unitsSold * p.sellingPrice,
      currentQty: p.quantity,
      reorderPoint: p.reorderPoint,
      status: getStockStatus(p.quantity, p.reorderPoint),
    };
  });

  performanceRows.sort((a, b) => b.unitsSold - a.unitsSold);

  const lowStockRows = filteredProducts
    .filter((p) => getStockStatus(p.quantity, p.reorderPoint) !== 'in_stock')
    .map((p) => ({
      ...p,
      status: getStockStatus(p.quantity, p.reorderPoint),
      supplierName: suppliers.find((s) => s.id === p.supplierId)?.companyName ?? 'Unassigned',
      shortfall: Math.max(0, p.reorderPoint * 2 - p.quantity),
    }))
    .sort((a, b) => a.quantity - b.quantity);

  const totalCostValue = filteredProducts.reduce((s, p) => s + p.quantity * p.unitCost, 0);
  const totalRetailValue = filteredProducts.reduce((s, p) => s + p.quantity * p.sellingPrice, 0);
  const totalUnitsOut = windowTransactions
    .filter((t) => t.type === 'stock_out')
    .reduce((s, t) => s + t.quantityChange, 0);
  const totalUnitsIn = windowTransactions
    .filter((t) => t.type === 'stock_in')
    .reduce((s, t) => s + t.quantityChange, 0);

  return {
    filteredProducts,
    windowTransactions,
    categoryBreakdown,
    performanceRows,
    lowStockRows,
    summary: {
      totalCostValue,
      totalRetailValue,
      totalUnitsOut,
      totalUnitsIn,
      lowStockCount: lowStockRows.length,
    },
  };
}

export function generateReportCsv(
  rows: ProductPerformanceRow[],
  days: DateRangeDays,
  category: string
): string {
  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Current Stock',
    'Reorder Point',
    'Status',
    `Units Out (${days}D)`,
    `Units In (${days}D)`,
    `Est. Revenue (${days}D)`,
  ];

  const escapeCsv = (val: string | number) => {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    `# SmartStock AI Sample Report - Window: ${days}D - Category: ${category}`,
    headers.join(','),
    ...rows.map((r) =>
      [
        r.sku,
        r.name,
        r.category,
        r.currentQty,
        r.reorderPoint,
        getStockStatusLabel(r.status),
        r.unitsSold,
        r.unitsRestocked,
        r.estimatedRevenue.toFixed(2),
      ]
        .map(escapeCsv)
        .join(',')
    ),
  ];

  return lines.join('\n');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
