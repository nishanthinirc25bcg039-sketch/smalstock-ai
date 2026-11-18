import { useMemo, useState } from 'react';
import {
  MessageSquare,
  Minus,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Product, PurchaseOrder, StockTransaction, Supplier } from '../types/inventory';
import { generateAiRecommendations, generateDailySummary } from '../utils/aiEngine';
import { formatCurrency } from '../utils/inventoryEngine';

interface AiInsightsViewProps {
  products: Product[];
  transactions: StockTransaction[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onCreatePurchaseOrder: (product: Product, suggestedQty?: number) => void;
  onOpenChat: () => void;
}

export function AiInsightsView({
  products,
  transactions,
  suppliers,
  purchaseOrders,
  onCreatePurchaseOrder,
  onOpenChat,
}: AiInsightsViewProps) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const summary = useMemo(() => {
    void refreshCount;
    return generateDailySummary(products, transactions, purchaseOrders, suppliers);
  }, [products, transactions, purchaseOrders, suppliers, refreshCount]);

  const recommendations = useMemo(
    () => generateAiRecommendations(products, transactions, suppliers),
    [products, transactions, suppliers]
  );

  const risingTrends = recommendations.filter((r) => r.trendDirection === 'rising');
  const fallingTrends = recommendations.filter((r) => r.trendDirection === 'falling');
  const reorderCandidates = recommendations.filter((r) => r.suggestedReorderQty > 0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setRefreshCount((c) => c + 1);
      setIsRefreshing(false);
    }, 220);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-orange-600">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AI Demand & Reorder Analysis · Based on sample data</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight mt-1">
            AI Stock Insights
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Simulated trend diagnostics computed from your displayed demo catalog and transaction
            velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Refresh Summary</span>
          </button>
          <button
            type="button"
            onClick={onOpenChat}
            className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap"
          >
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span>Open Inventory Chatbot</span>
          </button>
        </div>
      </div>

      {/* Generated Inventory Summary Card */}
      <section
        aria-label="Generated inventory summary"
        className="bg-white border border-slate-200 rounded-xl p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">{summary.generatedAtLabel}</p>
            <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
              {summary.headline}
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500 shrink-0">
            Illustrative · Based on sample data
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Key Observations</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {summary.highlights.map((h, i) => (
                <li key={i} className="leading-relaxed">
                  • {h}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-900 mb-2.5">Suggested Next Steps</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {summary.recommendedActions.map((a, i) => (
                <li key={i} className="leading-relaxed">
                  {i + 1}. {a}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rising vs Falling Demand */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section aria-label="Rising demand trends" className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Rising Demand</span>
            </h2>
            <span className="text-xs text-slate-500">14-day vs. prior 16-day pace</span>
          </div>
          {risingTrends.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">
              No upward demand spikes detected in current sample transactions.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {risingTrends.slice(0, 4).map((item) => (
                <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {item.dailyVelocity} units/day · {item.currentQty} on hand
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-emerald-700 shrink-0">
                    +{item.trendPercent}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Falling or steady demand trends" className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span>Cooling or Steady Demand</span>
            </h2>
            <span className="text-xs text-slate-500">Slower recent velocity</span>
          </div>
          {fallingTrends.length === 0 ? (
            <div className="divide-y divide-slate-100">
              {recommendations
                .filter((r) => r.trendDirection === 'steady')
                .slice(0, 3)
                .map((item) => (
                  <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        {item.currentQty} units in stock
                      </p>
                    </div>
                    <span className="text-xs font-medium text-slate-500 inline-flex items-center gap-1 shrink-0">
                      <Minus className="w-3 h-3" aria-hidden="true" />
                      Steady
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {fallingTrends.slice(0, 4).map((item) => (
                <div key={item.productId} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">
                      {item.dailyVelocity} units/day · {item.currentQty} on hand
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-amber-700 shrink-0">
                    −{item.trendPercent}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Reorder Recommendations */}
      <section aria-label="Reorder recommendations" className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Recommended Reorders ({reorderCandidates.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quantities calculated from reorder thresholds and 21-day target stock buffer (based on
              sample data)
            </p>
          </div>
        </div>

        {reorderCandidates.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">
            All products have sufficient coverage for the next 21 days.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reorderCandidates.map((rec) => {
              const product = products.find((p) => p.id === rec.productId);
              return (
                <div
                  key={rec.productId}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono">{rec.sku}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rec.supplierName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-700 font-medium">
                        {rec.confidenceLabel} (sample data)
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{rec.productName}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{rec.rationale}</p>
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-4 shrink-0">
                    <div className="text-left lg:text-right font-mono tabular-nums">
                      <p className="text-sm font-bold text-slate-900">
                        Suggest +{rec.suggestedReorderQty} units
                      </p>
                      <p className="text-xs text-slate-500">
                        Est. {formatCurrency(rec.estimatedOrderCost)}
                      </p>
                    </div>
                    {product && (
                      <button
                        type="button"
                        onClick={() => onCreatePurchaseOrder(product, rec.suggestedReorderQty)}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Create Purchase Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
