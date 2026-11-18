import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { PRODUCT_CATEGORIES } from '../data/seedData';
import { Product, ProductFilters, Supplier, TransactionType } from '../types/inventory';
import {
  filterAndSortProducts,
  formatCurrency,
  getStockStatus,
  getStockStatusLabel,
} from '../utils/inventoryEngine';
import { ConfirmDialog } from './ConfirmDialog';
import { SafeImage } from './SafeImage';

interface ProductCatalogProps {
  products: Product[];
  suppliers: Supplier[];
  globalSearch: string;
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenStockModal: (productId: string, type: TransactionType) => void;
}

export function ProductCatalog({
  products,
  suppliers,
  globalSearch,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenStockModal,
}: ProductCatalogProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [supplierId, setSupplierId] = useState('all');
  const [status, setStatus] = useState<ProductFilters['status']>('all');
  const [sortBy, setSortBy] = useState<ProductFilters['sortBy']>('name_asc');
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const effectiveSearch = localSearch || globalSearch;

  const filteredProducts = useMemo(
    () =>
      filterAndSortProducts(products, {
        search: effectiveSearch,
        category,
        supplierId,
        status,
        sortBy,
      }),
    [products, effectiveSearch, category, supplierId, status, sortBy]
  );

  const getSupplierName = (id: string) =>
    suppliers.find((s) => s.id === id)?.companyName ?? 'Unassigned';

  const renderStatusLabel = (qty: number, reorderPoint: number) => {
    const st = getStockStatus(qty, reorderPoint);
    if (st === 'out_of_stock') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{getStockStatusLabel(st)}</span>
        </span>
      );
    }
    if (st === 'low_stock') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{getStockStatusLabel(st)}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{getStockStatusLabel(st)}</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {filteredProducts.length} of {products.length} products shown · Instant search, stock
            adjustments, and SKU controls
          </p>
        </div>
        <button
          type="button"
          onClick={onAddProduct}
          className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 relative">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Search products by name or SKU"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search name, SKU, or category..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            >
              <option value="all">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.companyName}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Sort products"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductFilters['sortBy'])}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
            >
              <option value="name_asc">Name (A–Z)</option>
              <option value="qty_asc">Lowest Stock</option>
              <option value="qty_desc">Highest Stock</option>
              <option value="value_desc">Highest Value</option>
              <option value="cost_desc">Unit Cost</option>
            </select>
          </div>
        </div>

        {/* Stock Status Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(
              [
                { value: 'all', label: 'All Stock' },
                { value: 'in_stock', label: 'In Stock' },
                { value: 'low_stock', label: 'Low Stock' },
                { value: 'out_of_stock', label: 'Out of Stock' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  status === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(effectiveSearch || category !== 'all' || supplierId !== 'all' || status !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setCategory('all');
                setSupplierId('all');
                setStatus('all');
              }}
              className="text-xs font-medium text-orange-600 hover:text-orange-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-bold text-slate-900">
            No products match your current filters
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Try clearing your search query or add a new SKU to the catalog.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setCategory('all');
                setSupplierId('all');
                setStatus('all');
              }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={onAddProduct}
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
            >
              Add Product
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 pl-4 pr-2">Product</th>
                    <th className="py-3 px-2">SKU</th>
                    <th className="py-3 px-2 hidden xl:table-cell">Category</th>
                    <th className="py-3 px-2">Supplier</th>
                    <th className="py-3 px-2 text-right">Stock</th>
                    <th className="py-3 px-2 text-right">Cost</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 pl-2 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-4 pr-2">
                        <div className="flex items-center gap-2.5">
                          <SafeImage
                            src={product.imageUrl}
                            alt={product.name}
                            fallbackLabel={product.name}
                            className="w-9 h-9 rounded-lg"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[190px] xl:max-w-[230px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500 font-mono tabular-nums truncate">
                              Retail {formatCurrency(product.sellingPrice)}
                              <span className="xl:hidden"> · {product.category}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {product.sku}
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-700 whitespace-nowrap hidden xl:table-cell">
                        {product.category}
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-600 max-w-[140px] truncate">
                        {getSupplierName(product.supplierId)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums whitespace-nowrap">
                        <span className="font-semibold text-slate-900">{product.quantity}</span>
                        <span className="text-xs text-slate-400"> / {product.reorderPoint}</span>
                      </td>
                      <td className="py-3 px-2 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                        {formatCurrency(product.unitCost)}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {renderStatusLabel(product.quantity, product.reorderPoint)}
                      </td>
                      <td className="py-3 pl-2 pr-4 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            onClick={() => onOpenStockModal(product.id, 'stock_in')}
                            aria-label={`Stock in ${product.name}`}
                            title="Stock In"
                            className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                          >
                            <ArrowDownLeft className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenStockModal(product.id, 'stock_out')}
                            aria-label={`Stock out ${product.name}`}
                            title="Stock Out"
                            className="p-1.5 text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            aria-label={`View ${product.name}`}
                            title="View Details"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditProduct(product)}
                            aria-label={`Edit ${product.name}`}
                            title="Edit Product"
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingProduct(product)}
                            aria-label={`Delete ${product.name}`}
                            title="Delete Product"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <SafeImage
                    src={product.imageUrl}
                    alt={product.name}
                    fallbackLabel={product.name}
                    className="w-12 h-12 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono">
                      {product.sku} · {product.category}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block">On Hand</span>
                    <span className="font-mono tabular-nums font-bold text-slate-900">
                      {product.quantity} / {product.reorderPoint}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Unit Cost</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900">
                      {formatCurrency(product.unitCost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status</span>
                    {renderStatusLabel(product.quantity, product.reorderPoint)}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenStockModal(product.id, 'stock_in')}
                      className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg"
                    >
                      + In
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenStockModal(product.id, 'stock_out')}
                      className="px-2.5 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 rounded-lg"
                    >
                      − Out
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingProduct(product)}
                      aria-label={`View ${product.name}`}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      aria-label={`Edit ${product.name}`}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingProduct(product)}
                      aria-label={`Delete ${product.name}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Product Detail Quick View Modal */}
      {viewingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-product-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <SafeImage
                  src={viewingProduct.imageUrl}
                  alt={viewingProduct.name}
                  fallbackLabel={viewingProduct.name}
                  className="w-14 h-14 rounded-xl"
                />
                <div>
                  <h2 id="view-product-title" className="font-display text-lg font-bold text-slate-900">
                    {viewingProduct.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {viewingProduct.sku} · {viewingProduct.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingProduct(null)}
                aria-label="Close product details"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mt-4 leading-relaxed">
              {viewingProduct.description || 'No description provided for this SKU.'}
            </p>

            <dl className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-100 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Supplier</dt>
                <dd className="font-medium text-slate-900 mt-0.5">
                  {getSupplierName(viewingProduct.supplierId)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Status</dt>
                <dd className="mt-0.5">
                  {renderStatusLabel(viewingProduct.quantity, viewingProduct.reorderPoint)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Current Stock / Reorder Point</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {viewingProduct.quantity} / {viewingProduct.reorderPoint} units
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Unit Cost / Selling Price</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
                  {formatCurrency(viewingProduct.unitCost)} / {formatCurrency(viewingProduct.sellingPrice)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  onEditProduct(p);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Edit Product
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = viewingProduct;
                  setViewingProduct(null);
                  onOpenStockModal(p.id, 'stock_in');
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
              >
                Adjust Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deletingProduct)}
        destructive
        title={`Delete "${deletingProduct?.name}"?`}
        description="This removes the SKU from your local sample catalog. Existing historical transactions will remain in the ledger for audit clarity."
        confirmLabel="Delete Product"
        onCancel={() => setDeletingProduct(null)}
        onConfirm={() => {
          if (deletingProduct) {
            onDeleteProduct(deletingProduct.id);
            setDeletingProduct(null);
          }
        }}
      />
    </div>
  );
}
