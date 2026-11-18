import { FormEvent, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEMO_IMAGES, PRODUCT_CATEGORIES } from '../data/seedData';
import { Product, Supplier } from '../types/inventory';
import { validateProductInput } from '../utils/inventoryEngine';
import { SafeImage } from './SafeImage';

interface ProductFormModalProps {
  open: boolean;
  editingProduct: Product | null;
  products: Product[];
  suppliers: Supplier[];
  onSave: (productData: Omit<Product, 'id' | 'updatedAt'>, editingId?: string) => void;
  onClose: () => void;
}

const IMAGE_PRESETS = [
  { label: 'None (Category icon)', url: '' },
  { label: 'Coffee Pouch', url: DEMO_IMAGES.coffee },
  { label: 'Pour-Over Kettle', url: DEMO_IMAGES.kettle },
  { label: 'Matcha Tin', url: DEMO_IMAGES.matcha },
];

export function ProductFormModal({
  open,
  editingProduct,
  products,
  suppliers,
  onSave,
  onClose,
}: ProductFormModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategory(editingProduct.category);
      setDescription(editingProduct.description);
      setSupplierId(editingProduct.supplierId);
      setUnitCost(String(editingProduct.unitCost));
      setSellingPrice(String(editingProduct.sellingPrice));
      setQuantity(String(editingProduct.quantity));
      setReorderPoint(String(editingProduct.reorderPoint));
      setImageUrl(editingProduct.imageUrl ?? '');
    } else {
      setName('');
      setSku('');
      setCategory(PRODUCT_CATEGORIES[0]);
      setDescription('');
      setSupplierId(suppliers[0]?.id ?? '');
      setUnitCost('');
      setSellingPrice('');
      setQuantity('0');
      setReorderPoint('15');
      setImageUrl('');
    }
    setErrors({});
  }, [open, editingProduct, suppliers]);

  if (!open) return null;

  const handleGenerateSku = () => {
    const catPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const namePrefix = (name.trim() || 'SKU')
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, 'X');
    const num = String(Math.floor(100 + Math.random() * 899));
    setSku(`${catPrefix}-${namePrefix}-${num}`);
    if (errors.sku) setErrors((prev) => ({ ...prev, sku: '' }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validation = validateProductInput(
      {
        name,
        sku,
        category,
        supplierId,
        unitCost,
        sellingPrice,
        quantity,
        reorderPoint,
      },
      products,
      editingProduct?.id
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    onSave(
      {
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        category: category.trim(),
        description: description.trim(),
        supplierId,
        unitCost: Number(Number(unitCost).toFixed(2)),
        sellingPrice: Number(Number(sellingPrice).toFixed(2)),
        quantity: Number(quantity),
        reorderPoint: Number(reorderPoint),
        imageUrl: imageUrl.trim() || undefined,
      },
      editingProduct?.id
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h2 id="product-form-title" className="font-display text-lg font-bold text-slate-900">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Changes update your local demo catalog immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product form"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="prod-name" className="block text-sm font-medium text-slate-700 mb-1">
                Product Name <span className="text-red-600">*</span>
              </label>
              <input
                id="prod-name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((p) => ({ ...p, name: '' }));
                }}
                placeholder="e.g., Guatemala Huehuetenango Roast (340g)"
                className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.name ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="prod-sku" className="text-sm font-medium text-slate-700">
                  SKU <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Auto-generate
                </button>
              </div>
              <input
                id="prod-sku"
                type="text"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  if (errors.sku) setErrors((p) => ({ ...p, sku: '' }));
                }}
                placeholder="COF-GUA-340"
                className={`w-full px-3.5 py-2 text-sm font-mono uppercase border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.sku ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.sku && <p className="text-xs text-red-600 mt-1">{errors.sku}</p>}
            </div>

            <div>
              <label htmlFor="prod-category" className="block text-sm font-medium text-slate-700 mb-1">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                id="prod-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="prod-supplier" className="block text-sm font-medium text-slate-700 mb-1">
                Primary Supplier <span className="text-red-600">*</span>
              </label>
              <select
                id="prod-supplier"
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  if (errors.supplierId) setErrors((p) => ({ ...p, supplierId: '' }));
                }}
                className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.supplierId ? 'border-red-400' : 'border-slate-200'
                }`}
              >
                <option value="">Select supplier...</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.companyName} ({sup.deliveryStatus})
                  </option>
                ))}
              </select>
              {errors.supplierId && <p className="text-xs text-red-600 mt-1">{errors.supplierId}</p>}
            </div>

            <div>
              <label htmlFor="prod-cost" className="block text-sm font-medium text-slate-700 mb-1">
                Unit Cost (USD) <span className="text-red-600">*</span>
              </label>
              <input
                id="prod-cost"
                type="number"
                step="0.01"
                min="0"
                value={unitCost}
                onChange={(e) => {
                  setUnitCost(e.target.value);
                  if (errors.unitCost) setErrors((p) => ({ ...p, unitCost: '' }));
                }}
                placeholder="12.50"
                className={`w-full px-3.5 py-2 text-sm font-mono tabular-nums border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.unitCost ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.unitCost && <p className="text-xs text-red-600 mt-1">{errors.unitCost}</p>}
            </div>

            <div>
              <label htmlFor="prod-price" className="block text-sm font-medium text-slate-700 mb-1">
                Selling Price (USD) <span className="text-red-600">*</span>
              </label>
              <input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(e.target.value);
                  if (errors.sellingPrice) setErrors((p) => ({ ...p, sellingPrice: '' }));
                }}
                placeholder="24.00"
                className={`w-full px-3.5 py-2 text-sm font-mono tabular-nums border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.sellingPrice ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.sellingPrice && (
                <p className="text-xs text-red-600 mt-1">{errors.sellingPrice}</p>
              )}
            </div>

            <div>
              <label htmlFor="prod-qty" className="block text-sm font-medium text-slate-700 mb-1">
                Current Quantity <span className="text-red-600">*</span>
              </label>
              <input
                id="prod-qty"
                type="number"
                step="1"
                min="0"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  if (errors.quantity) setErrors((p) => ({ ...p, quantity: '' }));
                }}
                className={`w-full px-3.5 py-2 text-sm font-mono tabular-nums border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.quantity ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.quantity && <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label htmlFor="prod-reorder" className="block text-sm font-medium text-slate-700 mb-1">
                Reorder Point <span className="text-red-600">*</span>
              </label>
              <input
                id="prod-reorder"
                type="number"
                step="1"
                min="0"
                value={reorderPoint}
                onChange={(e) => {
                  setReorderPoint(e.target.value);
                  if (errors.reorderPoint) setErrors((p) => ({ ...p, reorderPoint: '' }));
                }}
                className={`w-full px-3.5 py-2 text-sm font-mono tabular-nums border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600 ${
                  errors.reorderPoint ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {errors.reorderPoint && (
                <p className="text-xs text-red-600 mt-1">{errors.reorderPoint}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="prod-desc" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="prod-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief item specification, weight, or storage instructions..."
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="prod-image-preset" className="block text-sm font-medium text-slate-700 mb-1">
                Optional Product Image
              </label>
              <div className="flex items-center gap-3">
                <SafeImage
                  src={imageUrl || undefined}
                  alt={name || 'Product thumbnail preview'}
                  fallbackLabel={name || category}
                  className="w-12 h-12 rounded-lg"
                />
                <select
                  id="prod-image-preset"
                  value={IMAGE_PRESETS.some((p) => p.url === imageUrl) ? imageUrl : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') setImageUrl(e.target.value);
                  }}
                  className="flex-1 px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                >
                  {IMAGE_PRESETS.map((preset) => (
                    <option key={preset.label} value={preset.url}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
            >
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
