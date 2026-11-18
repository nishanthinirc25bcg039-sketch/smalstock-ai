import { useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../data/seedData';
import { DateRangeDays, Product, StockTransaction, Supplier } from '../types/inventory';
import {
  buildReportData,
  buildStockMovementSeries,
  formatCurrency,
  generateReportCsv,
  getStockStatusLabel,
} from '../utils/inventoryEngine';

interface ReportsViewProps {
  products: Product[];
  transactions: StockTransaction[];
  suppliers: Supplier[];
  onExportSuccess: (filename: string) => void;
}

type ReportTab = 'value' | 'movement' | 'performance' | 'low_stock';

export function ReportsView({
  products,
  transactions,
  suppliers,
  onExportSuccess,
}: ReportsViewProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('value');
  const [days, setDays] = useState<DateRangeDays>(30);
  const [category, setCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const report = useMemo(
    () => buildReportData(products, transactions, suppliers, days, category),
    [products, transactions, suppliers, days, category]
  );

  const movementSeries = useMemo(() => {
    const filteredTxs =
      category === 'all'
        ? transactions
        : transactions.filter((tx) => {
            const prod = products.find((p) => p.id === tx.productId);
            return prod?.category === category;
          });
    return buildStockMovementSeries(filteredTxs, days);
  }, [transactions, products, category, days]);

  const handleFilterRefresh = (nextDays: DateRangeDays, nextCategory: string) => {
    setIsLoading(true);
    setDays(nextDays);
    setCategory(nextCategory);
    setTimeout(() => setIsLoading(false), 180);
  };

  const handleExportCsv = () => {
    const csv = generateReportCsv(report.performanceRows, days, category);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = `smartstock-report-${days}d-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onExportSuccess(filename);
  };

  const maxCatVal = Math.max(1, ...report.categoryBreakdown.map((c) => c.costValue));
  const maxMoveVal = Math.max(
    1,
    ...movementSeries.map((m) => Math.max(m.stockIn, m.stockOut))
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Inventory Reports
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Valuation, stock movement, product velocity, and low-stock audit from sample store data
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Report Tabs + Date & Category Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
          {(
            [
              { id: 'value', label: 'Inventory Value' },
              { id: 'movement', label: 'Stock Movement' },
              { id: 'performance', label: 'Product Performance' },
              { id: 'low_stock', label: 'Low-Stock Audit' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {([7, 30, 90] as DateRangeDays[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => handleFilterRefresh(d, category)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  days === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {d}D
              </button>
            ))}
          </div>

          <select
            aria-label="Filter report by category"
            value={category}
            onChange={(e) => handleFilterRefresh(days, e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => handleFilterRefresh(days, category)}
            aria-label="Refresh report metrics"
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Inventory Cost Value</p>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
            {formatCurrency(report.summary.totalCostValue)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Potential Retail Value</p>
          <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-1.5">
            {formatCurrency(report.summary.totalRetailValue)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Units Dispatched ({days}D)</p>
          <p className="font-display text-2xl font-bold text-orange-700 tabular-nums mt-1.5">
            {report.summary.totalUnitsOut.toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Units Received ({days}D)</p>
          <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums mt-1.5">
            {report.summary.totalUnitsIn.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Loading Skeleton State */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3" aria-busy="true">
          <div className="h-5 w-48 bg-slate-100 rounded animate-pulse" />
          <div className="h-40 w-full bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-8 w-full bg-slate-100 rounded animate-pulse" />
          <div className="h-8 w-5/6 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : report.filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-bold text-slate-900">
            No report records found for this category
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Switch back to All Categories or add products in this category to inspect metrics.
          </p>
        </div>
      ) : (
        <>
          {activeTab === 'value' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Valuation Breakdown by Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cost basis vs. estimated retail value across current on-hand stock
                </p>
              </div>
              <div className="space-y-4">
                {report.categoryBreakdown.map((cat) => {
                  const pct = Math.round((cat.costValue / maxCatVal) * 100);
                  return (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-900">
                          {cat.category}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({cat.productCount} SKUs · {cat.units} units)
                          </span>
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900">
                          {formatCurrency(cat.costValue)}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            / {formatCurrency(cat.retailValue)} retail
                          </span>
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(4, pct)}%` }}
                          className="h-full bg-orange-600 rounded-full transition-all duration-300"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'movement' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900">
                  Stock In vs. Stock Out ({days} Days)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Period volume across {report.windowTransactions.length} recorded transactions
                </p>
              </div>
              <div className="h-56 flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
                {movementSeries.map((b) => (
                  <div key={b.dateKey} className="flex-1 h-full flex flex-col justify-end items-center">
                    <div className="w-full max-w-[48px] h-full flex items-end justify-center gap-1.5">
                      <div
                        title={`In: ${b.stockIn}`}
                        style={{ height: `${Math.max(b.stockIn > 0 ? 8 : 2, (b.stockIn / maxMoveVal) * 100)}%` }}
                        className="w-1/2 bg-emerald-600 rounded-t-sm"
                      />
                      <div
                        title={`Out: ${b.stockOut}`}
                        style={{ height: `${Math.max(b.stockOut > 0 ? 8 : 2, (b.stockOut / maxMoveVal) * 100)}%` }}
                        className="w-1/2 bg-orange-600 rounded-t-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-3">
                {movementSeries.map((b) => (
                  <div key={b.dateKey} className="flex-1 text-center text-xs font-mono text-slate-500">
                    <div>{b.label}</div>
                    <div className="text-[11px] text-slate-700 mt-0.5">
                      +{b.stockIn} / −{b.stockOut}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 text-right">Units Out ({days}D)</th>
                      <th className="py-3 px-3 text-right">Units In ({days}D)</th>
                      <th className="py-3 px-3 text-right">Est. Revenue</th>
                      <th className="py-3 px-4 text-right">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {report.performanceRows.map((r) => (
                      <tr key={r.productId} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{r.name}</p>
                          <p className="text-xs font-mono text-slate-500">{r.sku}</p>
                        </td>
                        <td className="py-3 px-3 text-xs text-slate-600">{r.category}</td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-orange-700">
                          {r.unitsSold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700">
                          {r.unitsRestocked}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-900">
                          {formatCurrency(r.estimatedRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {r.currentQty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'low_stock' && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              {report.lowStockRows.length === 0 ? (
                <div className="p-10 text-center text-sm text-slate-600">
                  No low-stock or out-of-stock SKUs in this category right now.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-3">Supplier</th>
                        <th className="py-3 px-3 text-right">On Hand</th>
                        <th className="py-3 px-3 text-right">Reorder Point</th>
                        <th className="py-3 px-3 text-right">Target Replenish</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {report.lowStockRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4">
                            <p className="font-semibold text-slate-900">{row.name}</p>
                            <p className="text-xs font-mono text-slate-500">{row.sku}</p>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-700">{row.supplierName}</td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                            {row.quantity}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                            {row.reorderPoint}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-orange-700">
                            +{row.shortfall} units
                          </td>
                          <td className="py-3 px-4 text-xs font-semibold text-amber-700">
                            {getStockStatusLabel(row.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
