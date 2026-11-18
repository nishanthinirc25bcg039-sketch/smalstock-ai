import {
  AiDailySummary,
  AiRecommendation,
  ChatProposedAction,
  Product,
  PurchaseOrder,
  StockTransaction,
  Supplier,
} from '../types/inventory';
import { computeDashboardMetrics, formatCurrency, getStockStatus } from './inventoryEngine';

export function generateAiRecommendations(
  products: Product[],
  transactions: StockTransaction[],
  suppliers: Supplier[],
  referenceDate = new Date()
): AiRecommendation[] {
  const recentCutoff = new Date(referenceDate);
  recentCutoff.setDate(recentCutoff.getDate() - 14);
  const priorCutoff = new Date(referenceDate);
  priorCutoff.setDate(priorCutoff.getDate() - 30);

  return products
    .map((product) => {
      const prodOut = transactions.filter(
        (tx) => tx.productId === product.id && tx.type === 'stock_out'
      );

      let recentOut = 0;
      let priorOut = 0;
      for (const tx of prodOut) {
        const d = new Date(`${tx.date}T12:00:00`);
        if (d >= recentCutoff) recentOut += tx.quantityChange;
        else if (d >= priorCutoff) priorOut += tx.quantityChange;
      }

      const total30Out = recentOut + priorOut;
      const dailyVelocity = Number((total30Out / 30).toFixed(2));
      const daysOfCover =
        dailyVelocity > 0 ? Math.max(0, Math.round(product.quantity / dailyVelocity)) : null;

      let trendDirection: 'rising' | 'falling' | 'steady' = 'steady';
      let trendPercent = 0;
      if (recentOut > priorOut && recentOut > 0) {
        trendDirection = 'rising';
        trendPercent = priorOut > 0 ? Math.min(85, Math.round(((recentOut - priorOut) / priorOut) * 100)) : 28;
      } else if (priorOut > recentOut && priorOut > 0) {
        trendDirection = 'falling';
        trendPercent = Math.round(((priorOut - recentOut) / priorOut) * 100);
      }

      const status = getStockStatus(product.quantity, product.reorderPoint);
      const targetBuffer = Math.max(product.reorderPoint * 2, Math.ceil(dailyVelocity * 21));
      const suggestedReorderQty =
        status !== 'in_stock' || (daysOfCover !== null && daysOfCover <= 18)
          ? Math.max(10, targetBuffer - product.quantity)
          : 0;

      const supplier = suppliers.find((s) => s.id === product.supplierId);
      const confidenceLabel: AiRecommendation['confidenceLabel'] =
        prodOut.length >= 2 ? 'High confidence' : prodOut.length === 1 ? 'Medium confidence' : 'Illustrative estimate';

      let rationale = '';
      if (product.quantity <= 0) {
        rationale = `Out of stock with ${recentOut} units dispatched in the past 14 days. Immediate reorder recommended to prevent fulfillment delays.`;
      } else if (status === 'low_stock') {
        rationale = `On-hand stock (${product.quantity}) is at or below reorder point (${product.reorderPoint}). ${
          daysOfCover !== null ? `Estimated ~${daysOfCover} days of cover remaining.` : 'Based on sample threshold data.'
        }`;
      } else if (trendDirection === 'rising' && suggestedReorderQty > 0) {
        rationale = `14-day demand rose ${trendPercent}% (${recentOut} units out). Adding ${suggestedReorderQty} units keeps a 21-day safety buffer.`;
      } else if (trendDirection === 'falling') {
        rationale = `Demand slowed by ${trendPercent}% over the past 14 days. Current stock (${product.quantity}) covers anticipated orders.`;
      } else {
        rationale = `Stock levels are healthy (${product.quantity} units vs. ${product.reorderPoint} reorder point). No immediate purchase needed.`;
      }

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        currentQty: product.quantity,
        reorderPoint: product.reorderPoint,
        dailyVelocity,
        daysOfCover,
        trendDirection,
        trendPercent,
        suggestedReorderQty,
        estimatedOrderCost: Number((suggestedReorderQty * product.unitCost).toFixed(2)),
        confidenceLabel,
        rationale,
        supplierId: product.supplierId,
        supplierName: supplier?.companyName ?? 'Primary Supplier',
      };
    })
    .sort((a, b) => b.suggestedReorderQty - a.suggestedReorderQty || b.dailyVelocity - a.dailyVelocity);
}

export function generateDailySummary(
  products: Product[],
  transactions: StockTransaction[],
  purchaseOrders: PurchaseOrder[],
  suppliers: Supplier[],
  referenceDate = new Date()
): AiDailySummary {
  const metrics = computeDashboardMetrics(products, purchaseOrders);
  const recs = generateAiRecommendations(products, transactions, suppliers, referenceDate);
  const urgent = recs.filter((r) => r.suggestedReorderQty > 0);
  const fastest = [...recs].sort((a, b) => b.dailyVelocity - a.dailyVelocity)[0];

  const headline =
    metrics.outOfStockCount > 0
      ? `${metrics.outOfStockCount} item out of stock and ${metrics.lowStockCount - metrics.outOfStockCount} approaching reorder threshold.`
      : metrics.lowStockCount > 0
      ? `${metrics.lowStockCount} products need attention while ${metrics.totalStockUnits.toLocaleString()} total units remain active.`
      : `All ${metrics.totalProducts} catalog SKUs are above reorder thresholds today.`;

  const highlights: string[] = [
    `Total on-hand catalog valuation stands at ${formatCurrency(metrics.inventoryValue)} across ${metrics.totalStockUnits.toLocaleString()} units.`,
    fastest && fastest.dailyVelocity > 0
      ? `Highest recent movement: ${fastest.productName} averaging ${fastest.dailyVelocity} units/day.`
      : `Recent stock movement is balanced across categories with no unusual spikes.`,
    `${metrics.pendingPoCount} open purchase order${metrics.pendingPoCount === 1 ? '' : 's'} currently scheduled for inbound receiving.`,
  ];

  const recommendedActions: string[] = urgent.slice(0, 3).map((item) => {
    return `Create PO for ${item.suggestedReorderQty} units of ${item.productName} (${formatCurrency(
      item.estimatedOrderCost
    )}) from ${item.supplierName}.`;
  });

  if (recommendedActions.length === 0) {
    recommendedActions.push('Maintain current reorder thresholds and review supplier lead times ahead of weekend fulfillment.');
  }

  return {
    headline,
    generatedAtLabel: `Sample-data summary · Updated ${referenceDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`,
    highlights,
    recommendedActions,
    isSampleData: true,
  };
}

export interface ChatbotReply {
  text: string;
  proposedAction?: ChatProposedAction;
}

export function answerInventoryQuestion(
  question: string,
  products: Product[],
  transactions: StockTransaction[],
  suppliers: Supplier[],
  purchaseOrders: PurchaseOrder[]
): ChatbotReply {
  const q = question.trim().toLowerCase();
  const metrics = computeDashboardMetrics(products, purchaseOrders);
  const recs = generateAiRecommendations(products, transactions, suppliers);

  if (q.includes('worth') || q.includes('value') || q.includes('valuation')) {
    const retailTotal = products.reduce((s, p) => s + p.quantity * p.sellingPrice, 0);
    const topItem = [...products].sort((a, b) => b.quantity * b.unitCost - a.quantity * a.unitCost)[0];
    return {
      text:
        `Based on the displayed sample inventory, your current cost valuation is ${formatCurrency(
          metrics.inventoryValue
        )} across ${metrics.totalStockUnits.toLocaleString()} units (${metrics.totalProducts} products), with an estimated retail value of ${formatCurrency(
          retailTotal
        )}.` +
        (topItem
          ? ` Your highest-value SKU on hand is ${topItem.name} (${formatCurrency(
              topItem.quantity * topItem.unitCost
            )}).`
          : ''),
    };
  }

  if (q.includes('reorder') || q.includes('low') || q.includes('out of stock') || q.includes('buy')) {
    const urgent = recs.filter((r) => r.suggestedReorderQty > 0);
    if (urgent.length === 0) {
      return {
        text: 'All products in the displayed catalog are currently above their reorder points. No urgent purchase orders are needed right now.',
      };
    }
    const top = urgent[0];
    const listText = urgent
      .slice(0, 4)
      .map(
        (u) =>
          `• ${u.productName}: ${u.currentQty} on hand (reorder point ${u.reorderPoint}) → suggest +${u.suggestedReorderQty} units (~${formatCurrency(
            u.estimatedOrderCost
          )})`
      )
      .join('\n');

    return {
      text: `Based on current stock levels and sample demand velocity, ${urgent.length} product${
        urgent.length === 1 ? '' : 's'
      } should be reordered:\n\n${listText}\n\nNote: This is AI guidance only — stock and purchase orders will not change unless you confirm an action below.`,
      proposedAction: {
        kind: 'create_po',
        label: `Create PO for ${top.suggestedReorderQty}× ${top.productName}`,
        productId: top.productId,
        productName: top.productName,
        supplierId: top.supplierId,
        supplierName: top.supplierName,
        quantity: top.suggestedReorderQty,
        estimatedCost: top.estimatedOrderCost,
      },
    };
  }

  if (q.includes('fast') || q.includes('selling') || q.includes('trend') || q.includes('demand')) {
    const movers = [...recs]
      .filter((r) => r.dailyVelocity > 0)
      .sort((a, b) => b.dailyVelocity - a.dailyVelocity)
      .slice(0, 3);
    if (movers.length === 0) {
      return {
        text: 'No outbound stock-out transactions have been logged yet in this sample dataset to rank selling speed.',
      };
    }
    const lines = movers
      .map(
        (m, idx) =>
          `${idx + 1}. ${m.productName} — ${m.dailyVelocity} units/day (${m.trendDirection} trend, ${m.currentQty} remaining)`
      )
      .join('\n');
    return {
      text: `Here are the fastest-moving products from the displayed transaction history:\n\n${lines}`,
    };
  }

  if (q.includes('supplier') || q.includes('delay') || q.includes('delivery')) {
    const delayed = suppliers.filter((s) => s.deliveryStatus === 'Delayed');
    const openPos = purchaseOrders.filter((po) => po.status !== 'Received');
    return {
      text: `You have ${suppliers.length} suppliers configured (${
        delayed.length > 0
          ? `${delayed.map((d) => d.companyName).join(', ')} currently marked Delayed`
          : 'all on schedule or in transit'
      }) and ${openPos.length} open purchase order${openPos.length === 1 ? '' : 's'} totaling ${formatCurrency(
        openPos.reduce((s, p) => s + p.estimatedCost, 0)
      )}.`,
    };
  }

  // Fallback: check if user mentioned a product name or SKU
  const matchedProduct = products.find(
    (p) => q.includes(p.name.toLowerCase()) || q.includes(p.sku.toLowerCase())
  );
  if (matchedProduct) {
    const status = getStockStatus(matchedProduct.quantity, matchedProduct.reorderPoint);
    return {
      text: `${matchedProduct.name} (${matchedProduct.sku}) currently has ${matchedProduct.quantity} units in stock (reorder point: ${matchedProduct.reorderPoint}, status: ${status.replace('_', ' ')}), valued at ${formatCurrency(
        matchedProduct.quantity * matchedProduct.unitCost
      )}.`,
    };
  }

  return {
    text: `Here is a quick snapshot from your displayed sample inventory: ${metrics.totalProducts} products, ${metrics.totalStockUnits.toLocaleString()} total units worth ${formatCurrency(
      metrics.inventoryValue
    )}, ${metrics.lowStockCount} low/out-of-stock alerts, and ${metrics.pendingPoCount} open purchase orders. Try asking "What needs reordering?" or "Which products are selling faster?".`,
  };
}
