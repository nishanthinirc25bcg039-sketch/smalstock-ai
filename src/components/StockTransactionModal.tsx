import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';
import { formatIsoDateOffset } from '../data/seedData';
import { Product, Supplier, TransactionType } from '../types/inventory';
import { previewStockAdjustment } from '../utils/inventoryEngine';

interface StockTransactionModalProps {
  open: boolean;
  products: Product[];
  suppliers: Supplier[];
  initialProductId?: string;
  initialType?: TransactionType;
  onConfirm: (payload: {
    productId: string;
    type: TransactionType;
    quantity: number;
    date: string;
    counterparty: string;
    note: string;
  }) => void;
  onClose: () => void;
}

export function StockTransactionModal({
  open,
  products,
  suppliers,
  initialProductId,
  initialType = 'stock_in',
  onConfirm,
  onClose,
}: StockTransactionModalProps) {
  const [productId, setProductId] = useState('');
  const [type, setType] = useState<TransactionType>(initialType);
  const [quantityInput, setQuantityInput] = useState('10');
  const [date, setDate] = useState(formatIsoDateOffset(0));
  const [counterparty, setCounterparty] = useState('');
  const [note, setNote] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) return;
    const chosenId = initialProductId || products[0]?.id || '';
    setProductId(chosenId);
    setType(initialType);
    setQuantityInput('10');
    setDate(formatIsoDateOffset(0));
    const prod = products.find((p) => p.id === chosenId);
    const sup = suppliers.find((s) => s.id === prod?.supplierId);
    setCounterparty(
      initialType === 'stock_in'
        ? sup?.companyName ?? 'Supplier Delivery'
        : 'Retail & Online Fulfillment'
    );
    setNote('');
    setSubmitError('');
  }, [open, initialProductId, initialType, products, suppliers]);

  if (!open) return null;

  const selectedProduct = products.find((p) => p.id === productId);
  const parsedQty = Number(quantityInput);
  const preview = selectedProduct
    ? previewStockAdjustment(selectedProduct.quantity, type, parsedQty)
    : { valid: false, resultingQty: 0, error: 'Select a product first.' };

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    setSubmitError('');
    if (selectedProduct) {
      const sup = suppliers.find((s) => s.id === selectedProduct.supplierId);
      setCounterparty(
        nextType === 'stock_in'
          ? sup?.companyName ?? 'Supplier Delivery'
          : 'Retail & Online Fulfillment'
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setSubmitError('Please select a product.');
      return;
    }
    if (!preview.valid) {
      setSubmitError(preview.error || 'Invalid stock quantity.');
      return;
    }
    if (!counterparty.trim()) {
      setSubmitError(
        type === 'stock_in'
          ? 'Please enter the supplier or source.'
          : 'Please enter the destination or order channel.'
      );
      return;
    }

    onConfirm({
      productId: selectedProduct.id,
      type,
      quantity: parsedQty,
      date,
      counterparty: counterparty.trim(),
      note: note.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-tx-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="stock-tx-title" className="font-display text-lg font-bold text-slate-900">
              Record Stock Transaction
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates on-hand stock and logs an entry in Transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stock transaction modal"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          {/* Segmented Stock-In / Stock-Out selector */}
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Transaction Type</span>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeSwitch('stock_in')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  type === 'stock_in'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
                <span>Stock In (Receive)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('stock_out')}
                className={`py-2 px-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                  type === 'stock_out'
                    ? 'bg-white text-orange-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                <span>Stock Out (Dispatch)</span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tx-product" className="block text-sm font-medium text-slate-700 mb-1">
              Product
            </label>
            <select
              id="tx-product"
              value={productId}
              onChange={(e) => {
                const nextId = e.target.value;
                setProductId(nextId);
                setSubmitError('');
                const prod = products.find((p) => p.id === nextId);
                if (prod && type === 'stock_in') {
                  const sup = suppliers.find((s) => s.id === prod.supplierId);
                  if (sup) setCounterparty(sup.companyName);
                }
              }}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — {p.quantity} in stock
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="tx-qty" className="block text-sm font-medium text-slate-700 mb-1">
                Quantity
              </label>
              <input
                id="tx-qty"
                type="number"
                min="1"
                step="1"
                value={quantityInput}
                onChange={(e) => {
                  setQuantityInput(e.target.value);
                  setSubmitError('');
                }}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div>
              <label htmlFor="tx-date" className="block text-sm font-medium text-slate-700 mb-1">
                Date
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="tx-counterparty" className="block text-sm font-medium text-slate-700 mb-1">
              {type === 'stock_in' ? 'Supplier / Source' : 'Destination / Order Channel'}
            </label>
            <input
              id="tx-counterparty"
              type="text"
              value={counterparty}
              onChange={(e) => {
                setCounterparty(e.target.value);
                setSubmitError('');
              }}
              placeholder={type === 'stock_in' ? 'e.g., Groundwork Roasters' : 'e.g., Online Storefront Orders'}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <div>
            <label htmlFor="tx-note" className="block text-sm font-medium text-slate-700 mb-1">
              Note or Reference (Optional)
            </label>
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="PO number, batch ID, or reason"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          {/* Resulting Stock Preview */}
          {selectedProduct && (
            <div
              className={`p-3.5 rounded-xl border ${
                preview.valid
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Current on-hand</span>
                <span className="font-mono tabular-nums font-semibold text-slate-900">
                  {selectedProduct.quantity} units
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1 pt-1.5 border-t border-slate-200/80">
                <span className="font-medium text-slate-800">Resulting stock after confirmation</span>
                <span
                  className={`font-mono tabular-nums font-bold ${
                    !preview.valid
                      ? 'text-red-700'
                      : preview.resultingQty <= selectedProduct.reorderPoint
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {preview.valid ? `${preview.resultingQty} units` : 'Invalid'}
                </span>
              </div>
              {preview.error && (
                <p className="text-xs text-red-700 mt-2 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{preview.error}</span>
                </p>
              )}
            </div>
          )}

          {submitError && !preview.error && (
            <p role="alert" className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </p>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!preview.valid}
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Confirm {type === 'stock_in' ? 'Stock In' : 'Stock Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
