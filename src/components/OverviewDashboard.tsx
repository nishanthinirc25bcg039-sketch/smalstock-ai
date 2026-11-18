import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardList,
  DollarSign,
  MessageSquare,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import {
  ActiveScreen,
  DateRangeDays,
  Product,
  PurchaseOrder,
  StockTransaction,
  Supplier,
  TransactionType,
} from '../types/inventory';
import { generateDailySummary } from '../utils/aiEngine';
import {
  buildStockMovementSeries,
  computeDashboardMetrics,
  formatCurrency,
  getStockStatus,
} from '../utils/inventoryEngine';

interface OverviewDashboardProps {
  products: Product[];
  transactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  dateRange: DateRangeDays;
  onDateRangeChange: (days: DateRangeDays) => void;
  onNavigate: (screen: ActiveScreen) => void;
  onOpenStockModal: (productId?: string, type?: TransactionType) => void;
  onCreatePurchaseOrder: (product: Product) => void;
  onOpenChat: () => void;
}

export function OverviewDashboard({
  products,
  transactions,
  purchaseOrders,
  suppliers,
  dateRange,
  onDateRangeChange,
  onNavigate,
  onOpenStockModal,
  onCreatePurchaseOrder,
  onOpenChat,
}: OverviewDashboardProps) {
  const [hoveredBucket, setHoveredBucket] = useState<number | null>(null);
  const [summaryRefreshTick, setSummaryRefreshTick] = useState(0);

  const metrics = useMemo(
    () => computeDashboardMetrics(products, purchaseOrders),
    [products, purchaseOrders]
  );

  const movementSeries = useMemo(
    () => buildStockMovementSeries(transactions, dateRange),
    [transactions, dateRange]
  );

  const dailySummary = useMemo(() => {
    void summaryRefreshTick;
    return generateDailySummary(products, transactions, purchaseOrders, suppliers);
  }, [products, transactions, purchaseOrders, suppliers, summaryRefreshTick]);

  const maxBucketVal = Math.max(
    10,
    ...movementSeries.map((b) => Math.max(b.stockIn, b.stockOut))
  );

  const upcomingDeliveries = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status !== 'Received')
        .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate)),
    [purchaseOrders]
  );

  const recentActivity = transactions.slice(0, 5);

  const kpiCards = [
    {
      label: 'Total Products',
      value: metrics.totalProducts.toLocaleString(),
      subtext: 'Active SKUs in catalog',
      icon: Package,
      onClick: () => onNavigate('products'),
    },
    {
      label: 'Total Stock Units',
      value: metrics.totalStockUnits.toLocaleString(),
      subtext: 'Units across all shelves',
      icon: Boxes,
      onClick: () => onNavigate('products'),
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(metrics.inventoryValue),
      subtext: 'Cost valuation on hand',
      icon: DollarSign,
      onClick: () => onNavigate('reports'),
    },
    {
      label: 'Low-Stock Products',
      value: metrics.lowStockCount.toLocaleString(),
      subtext:
        metrics.outOfStockCount > 0
          ? `${metrics.outOfStockCount} out of stock`
          : 'At or below reorder point',
      icon: AlertTriangle,
      highlight: metrics.lowStockCount > 0,
      onClick: () => onNavigate('products'),
    },
    {
      label: 'Pending Purchase Orders',
      value: metrics.pendingPoCount.toLocaleString(),
      subtext: 'Awaiting inbound receipt',
      icon: ClipboardList,
      onClick: () => onNavigate('suppliers'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Primary Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Operations Overview
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Northwind Pantry & Brew Co. · Sample inventory telemetry updated live as you transact
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onOpenStockModal(undefined, 'stock_in')}
            className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            Record Stock Move
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-orange-600" aria-hidden="true" />
            <span>Ask Stock Assistant</span>
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    card.highlight ? 'text-amber-600' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
              </div>
              <p className="font-display text-2xl font-bold text-slate-900 tabular-nums mt-2">
                {card.value}
              </p>
              <p
                className={`text-xs mt-1 ${
                  card.highlight ? 'text-amber-700 font-medium' : 'text-slate-500'
                }`}
              >
                {card.subtext}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Inventory Movement Chart + AI Daily Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Inventory Movement Chart */}
        <section
          aria-label="Inventory movement chart"
          className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Inventory Movement
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Units received vs. units dispatched across the selected window
              </p>
            </div>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
              {([7, 30, 90] as DateRangeDays[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onDateRangeChange(d)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    dateRange === d
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          {/* Chart Legend & Hover readout */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-xs text-slate-600">
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 inline-block" />
                Stock In (Received)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-600 inline-block" />
                Stock Out (Dispatched)
              </span>
            </div>
            {hoveredBucket !== null && movementSeries[hoveredBucket] && (
              <span className="font-mono tabular-nums text-slate-800">
                {movementSeries[hoveredBucket].label}: +{movementSeries[hoveredBucket].stockIn} in
                {' · '}−{movementSeries[hoveredBucket].stockOut} out
              </span>
            )}
          </div>

          {/* Responsive Bar Chart */}
          <div className="w-full pt-2">
            <div className="h-52 flex items-end justify-between gap-2 sm:gap-4 border-b border-slate-200 pb-2 px-1">
              {movementSeries.map((bucket, idx) => {
                const inPct = Math.round((bucket.stockIn / maxBucketVal) * 100);
                const outPct = Math.round((bucket.stockOut / maxBucketVal) * 100);
                return (
                  <div
                    key={bucket.dateKey}
                    onMouseEnter={() => setHoveredBucket(idx)}
                    onMouseLeave={() => setHoveredBucket(null)}
                    className="flex-1 h-full flex flex-col justify-end items-center group"
                  >
                    <div className="w-full max-w-[44px] h-full flex items-end justify-center gap-1">
                      <div
                        title={`${bucket.label}: ${bucket.stockIn} units in`}
                        style={{ height: `${Math.max(bucket.stockIn > 0 ? 6 : 2, inPct)}%` }}
                        className="w-1/2 bg-emerald-600/90 group-hover:bg-emerald-600 rounded-t-sm transition-all duration-200"
                      />
                      <div
                        title={`${bucket.label}: ${bucket.stockOut} units out`}
                        style={{ height: `${Math.max(bucket.stockOut > 0 ? 6 : 2, outPct)}%` }}
                        className="w-1/2 bg-orange-500/90 group-hover:bg-orange-600 rounded-t-sm transition-all duration-200"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2 sm:gap-4 pt-2 px-1">
              {movementSeries.map((bucket) => (
                <div key={bucket.dateKey} className="flex-1 text-center">
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 truncate block">
                    {bucket.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Daily Inventory Summary */}
        <section
          aria-label="Daily inventory summary"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-orange-600">
                  Daily Inventory Summary · Sample Data
                </p>
                <h2 className="font-display text-base font-bold text-slate-900 mt-1">
                  {dailySummary.headline}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSummaryRefreshTick((t) => t + 1)}
                aria-label="Refresh daily summary"
                className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-sm text-slate-700">
              {dailySummary.highlights.map((line, i) => (
                <p key={i} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-900 mb-2">Recommended Actions</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {dailySummary.recommendedActions.map((act, i) => (
                  <li key={i} className="leading-relaxed">
                    {i + 1}. {act}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onNavigate('insights')}
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>Open AI Insights</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenChat}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
            >
              Ask Chatbot
            </button>
          </div>
        </section>
      </div>

      {/* Bottom Row: Low-Stock Alerts, Recent Stock Activity, Upcoming Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low-Stock Alerts */}
        <section
          aria-label="Low-stock alerts"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Low-Stock Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Items at or below reorder threshold
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('products')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              View catalog
            </button>
          </div>

          {metrics.lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              All products are currently stocked above their reorder points.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.lowStockProducts.map((item) => {
                const status = getStockStatus(item.quantity, item.reorderPoint);
                const hasOpenPo = purchaseOrders.some(
                  (po) => po.productId === item.id && po.status !== 'Received'
                );
                return (
                  <div
                    key={item.id}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                        {item.quantity} on hand · Reorder at {item.reorderPoint}
                        {status === 'out_of_stock' && (
                          <span className="text-red-600 font-sans font-semibold">
                            {' · '}Out of Stock
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCreatePurchaseOrder(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{hasOpenPo ? 'Add PO' : 'Create purchase order'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Stock Activity */}
        <section
          aria-label="Recent stock activity"
          className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Recent Stock Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Latest recorded movements</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              All history
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentActivity.map((tx) => {
              const isIn = tx.type === 'stock_in';
              return (
                <div key={tx.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isIn ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {isIn ? (
                        <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{tx.productName}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {tx.date} · {tx.counterparty}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono tabular-nums text-xs font-semibold whitespace-nowrap shrink-0 ${
                      isIn ? 'text-emerald-700' : 'text-orange-700'
                    }`}
                  >
                    {isIn ? `+${tx.quantityChange}` : `−${tx.quantityChange}`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Upcoming Deliveries */}
        <section
          aria-label="Upcoming deliveries"
          className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                Upcoming Deliveries
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Open purchase orders</p>
            </div>
            <Truck className="w-4 h-4 text-slate-400" aria-hidden="true" />
          </div>

          {upcomingDeliveries.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No pending inbound deliveries.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {upcomingDeliveries.map((po) => (
                <div key={po.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {po.poNumber}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        po.status === 'In Transit' ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {po.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-800 truncate mt-1">
                    {po.productName}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                    +{po.quantity} units · ETA {po.expectedDate}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
