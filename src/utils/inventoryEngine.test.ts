import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDashboardMetrics,
  filterAndSortProducts,
  generateReportCsv,
  getStockStatus,
  previewStockAdjustment,
  validateProductInput,
} from './inventoryEngine';
import { createSeedProducts, createSeedPurchaseOrders, createSeedTransactions } from '../data/seedData';

test('getStockStatus distinguishes out_of_stock, low_stock, and in_stock', () => {
  assert.equal(getStockStatus(0, 15), 'out_of_stock');
  assert.equal(getStockStatus(15, 15), 'low_stock');
  assert.equal(getStockStatus(10, 15), 'low_stock');
  assert.equal(getStockStatus(16, 15), 'in_stock');
});

test('previewStockAdjustment prevents stock_out exceeding available quantity', () => {
  const blocked = previewStockAdjustment(12, 'stock_out', 15);
  assert.equal(blocked.valid, false);
  assert.equal(blocked.resultingQty, 12);
  assert.ok(blocked.error);

  const allowedOut = previewStockAdjustment(12, 'stock_out', 5);
  assert.equal(allowedOut.valid, true);
  assert.equal(allowedOut.resultingQty, 7);

  const allowedIn = previewStockAdjustment(12, 'stock_in', 20);
  assert.equal(allowedIn.valid, true);
  assert.equal(allowedIn.resultingQty, 32);
});

test('validateProductInput enforces required fields and unique SKU', () => {
  const products = createSeedProducts();
  const invalid = validateProductInput(
    {
      name: '',
      sku: 'COF-YIR-340',
      category: 'Coffee & Tea',
      supplierId: 'sup-1',
      unitCost: 0,
      sellingPrice: 12,
      quantity: -2,
      reorderPoint: 5,
    },
    products
  );
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.name);
  assert.ok(invalid.errors.sku);
  assert.ok(invalid.errors.unitCost);
  assert.ok(invalid.errors.quantity);

  const validEdit = validateProductInput(
    {
      name: 'Ethiopia Yirgacheffe Whole Bean (340g)',
      sku: 'COF-YIR-340',
      category: 'Coffee & Tea',
      supplierId: 'sup-1',
      unitCost: 11.5,
      sellingPrice: 21,
      quantity: 14,
      reorderPoint: 25,
    },
    products,
    'prod-1'
  );
  assert.equal(validEdit.valid, true);
});

test('computeDashboardMetrics calculates totals and low-stock count accurately', () => {
  const products = createSeedProducts();
  const pos = createSeedPurchaseOrders();
  const metrics = computeDashboardMetrics(products, pos);
  assert.equal(metrics.totalProducts, products.length);
  assert.ok(metrics.totalStockUnits > 0);
  assert.ok(metrics.inventoryValue > 0);
  assert.equal(metrics.pendingPoCount, 3);
  assert.equal(metrics.outOfStockCount, 1);
  assert.ok(metrics.lowStockCount >= 3);
});

test('filterAndSortProducts filters by status and sorts by quantity ascending', () => {
  const products = createSeedProducts();
  const lowOnly = filterAndSortProducts(products, {
    search: '',
    category: 'all',
    supplierId: 'all',
    status: 'low_stock',
    sortBy: 'qty_asc',
  });
  assert.ok(lowOnly.length > 0);
  for (let i = 1; i < lowOnly.length; i++) {
    assert.ok(lowOnly[i].quantity >= lowOnly[i - 1].quantity);
  }
});

test('generateReportCsv includes headers and product rows', () => {
  const txs = createSeedTransactions();
  assert.ok(txs.length > 0);
  const csv = generateReportCsv(
    [
      {
        productId: 'p1',
        name: 'Coffee "Reserve"',
        sku: 'COF-1',
        category: 'Coffee & Tea',
        unitsSold: 10,
        unitsRestocked: 20,
        estimatedRevenue: 210,
        currentQty: 14,
        reorderPoint: 25,
        status: 'low_stock',
      },
    ],
    30,
    'all'
  );
  assert.ok(csv.includes('SKU,Product Name'));
  assert.ok(csv.includes('"Coffee ""Reserve"""'));
});
