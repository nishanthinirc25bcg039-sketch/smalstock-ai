import { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Search } from 'lucide-react';
import { DateRangeDays, StockTransaction, TransactionType } from '../types/inventory';

interface TransactionsViewProps {
  transactions: StockTransaction[];
  onOpenStockModal: (productId?: string, type?: TransactionType) => void;
}

export function TransactionsView({ transactions, onOpenStockModal }: TransactionsViewProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [daysFilter, setDaysFilter] = useState<'all' | DateRangeDays>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (daysFilter !== 'all') {
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - daysFilter);
        cutoff.setHours(0, 0, 0, 0);
        if (new Date(`${tx.date}T12:00:00`) < cutoff) return false;
      }
      if (q) {
        const matchProd = tx.productName.toLowerCase().includes(q);
        const matchSku = tx.sku.toLowerCase().includes(q);
        const matchParty = tx.counterparty.toLowerCase().includes(q);
        const matchUser = tx.user.toLowerCase().includes(q);
        if (!matchProd && !matchSku && !matchParty && !matchUser) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, daysFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Stock Transactions
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {filtered.length} recorded movements · Full audit trail of stock-in and stock-out
            changes
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenStockModal(undefined, 'stock_in')}
          className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Record Transaction</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search transactions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, SKU, supplier, destination, or user..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { value: 'all', label: 'All Types' },
                { value: 'stock_in', label: 'Stock In' },
                { value: 'stock_out', label: 'Stock Out' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  typeFilter === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filter by timeframe"
            value={daysFilter}
            onChange={(e) =>
              setDaysFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as DateRangeDays))
            }
            className="px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          >
            <option value="all">All Dates</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Ledger Table / Cards */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-bold text-slate-900">
            No transactions match these filters
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Adjust the date window or record a new stock-in or stock-out event.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Change</th>
                  <th className="py-3 px-3 text-right">Previous</th>
                  <th className="py-3 px-3 text-right">Resulting</th>
                  <th className="py-3 px-3">Supplier / Destination</th>
                  <th className="py-3 px-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((tx) => {
                  const isIn = tx.type === 'stock_in';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-3 min-w-[200px]">
                        <p className="font-semibold text-slate-900">{tx.productName}</p>
                        <p className="text-xs text-slate-500 font-mono">
                          {tx.sku}
                          {tx.note ? ` · ${tx.note}` : ''}
                        </p>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                            <ArrowDownLeft className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Stock In</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-700 bg-orange-50 px-2.5 py-1 rounded-md">
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Stock Out</span>
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-bold whitespace-nowrap ${
                          isIn ? 'text-emerald-700' : 'text-orange-700'
                        }`}
                      >
                        {isIn ? `+${tx.quantityChange}` : `−${tx.quantityChange}`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-500">
                        {tx.previousStock}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                        {tx.resultingStock}
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-700 whitespace-nowrap">
                        {tx.counterparty}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {tx.user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
