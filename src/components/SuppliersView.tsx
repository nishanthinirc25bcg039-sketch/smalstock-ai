import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import {
  Product,
  PurchaseOrder,
  StockTransaction,
  Supplier,
  SupplierDeliveryStatus,
} from '../types/inventory';
import { formatCurrency } from '../utils/inventoryEngine';
import { ConfirmDialog } from './ConfirmDialog';

interface SuppliersViewProps {
  suppliers: Supplier[];
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  transactions: StockTransaction[];
  onSaveSupplier: (data: Omit<Supplier, 'id'>, editingId?: string) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

const DELIVERY_STATUSES: SupplierDeliveryStatus[] = ['On Schedule', 'In Transit', 'Delayed'];

export function SuppliersView({
  suppliers,
  products,
  purchaseOrders,
  transactions,
  onSaveSupplier,
  onDeleteSupplier,
}: SuppliersViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SupplierDeliveryStatus>('all');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    suppliers[0]?.id ?? null
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState<SupplierDeliveryStatus>('On Schedule');
  const [leadTimeDays, setLeadTimeDays] = useState('5');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!formOpen) return;
    if (editingSupplier) {
      setCompanyName(editingSupplier.companyName);
      setContactPerson(editingSupplier.contactPerson);
      setEmail(editingSupplier.email);
      setPhone(editingSupplier.phone);
      setDeliveryStatus(editingSupplier.deliveryStatus);
      setLeadTimeDays(String(editingSupplier.leadTimeDays));
      setAddress(editingSupplier.address);
      setNotes(editingSupplier.notes ?? '');
    } else {
      setCompanyName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setDeliveryStatus('On Schedule');
      setLeadTimeDays('5');
      setAddress('');
      setNotes('');
    }
    setFormError('');
  }, [formOpen, editingSupplier]);

  const filteredSuppliers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (statusFilter !== 'all' && s.deliveryStatus !== statusFilter) return false;
      if (q) {
        const match =
          s.companyName.toLowerCase().includes(q) ||
          s.contactPerson.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [suppliers, search, statusFilter]);

  const activeSupplier =
    suppliers.find((s) => s.id === selectedSupplierId) ?? filteredSuppliers[0] ?? null;

  const activeSupplierProducts = useMemo(
    () => (activeSupplier ? products.filter((p) => p.supplierId === activeSupplier.id) : []),
    [products, activeSupplier]
  );

  const activeSupplierPos = useMemo(
    () =>
      activeSupplier ? purchaseOrders.filter((po) => po.supplierId === activeSupplier.id) : [],
    [purchaseOrders, activeSupplier]
  );

  const activeSupplierActivity = useMemo(() => {
    if (!activeSupplier) return [];
    const prodIds = new Set(activeSupplierProducts.map((p) => p.id));
    return transactions
      .filter(
        (tx) =>
          prodIds.has(tx.productId) ||
          tx.counterparty.toLowerCase() === activeSupplier.companyName.toLowerCase()
      )
      .slice(0, 5);
  }, [activeSupplier, activeSupplierProducts, transactions]);

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormOpen(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      setFormError('Company name, contact person, email, and phone are required.');
      return;
    }
    const lead = Number(leadTimeDays);
    if (!Number.isInteger(lead) || lead < 1) {
      setFormError('Lead time must be at least 1 day.');
      return;
    }
    onSaveSupplier(
      {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        deliveryStatus,
        leadTimeDays: lead,
        address: address.trim() || 'Address on file',
        notes: notes.trim() || undefined,
      },
      editingSupplier?.id
    );
    setFormOpen(false);
  };

  const statusTextClass = (st: SupplierDeliveryStatus) => {
    if (st === 'Delayed') return 'text-red-700';
    if (st === 'In Transit') return 'text-amber-700';
    return 'text-emerald-700';
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Suppliers & Receiving
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {suppliers.length} partner vendors · Contact details, delivery status, and supplied SKUs
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search suppliers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, contact name, or email..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
          />
        </div>

        <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {(['all', ...DELIVERY_STATUSES] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="font-display text-base font-bold text-slate-900">
            No suppliers match your filter
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Reset your search or add a new supplier record.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Supplier List */}
          <div className="lg:col-span-7 space-y-3">
            {filteredSuppliers.map((sup) => {
              const suppliedCount = products.filter((p) => p.supplierId === sup.id).length;
              const isSelected = activeSupplier?.id === sup.id;
              return (
                <div
                  key={sup.id}
                  className={`bg-white border rounded-xl p-4 transition-colors ${
                    isSelected ? 'border-orange-500 ring-1 ring-orange-500/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSupplierId(sup.id)}
                      className="text-left flex-1 min-w-0 focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                        <h2 className="font-display text-base font-bold text-slate-900 truncate">
                          {sup.companyName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 break-words">
                        {sup.contactPerson} · {sup.email} · {sup.phone}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 font-mono tabular-nums">
                        {suppliedCount} supplied product{suppliedCount === 1 ? '' : 's'} ·{' '}
                        {sup.leadTimeDays}d lead time ·{' '}
                        <span
                          className={`font-sans font-semibold whitespace-nowrap ${statusTextClass(
                            sup.deliveryStatus
                          )}`}
                        >
                          {sup.deliveryStatus}
                        </span>
                      </p>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sup)}
                        aria-label={`Edit supplier ${sup.companyName}`}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingSupplier(sup)}
                        aria-label={`Delete supplier ${sup.companyName}`}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Supplier Detail Panel */}
          {activeSupplier && (
            <aside
              aria-label={`Supplier details for ${activeSupplier.companyName}`}
              className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold ${statusTextClass(activeSupplier.deliveryStatus)}`}>
                    {activeSupplier.deliveryStatus} · {activeSupplier.leadTimeDays}-day lead time
                  </p>
                  <h2 className="font-display text-lg font-bold text-slate-900 mt-1">
                    {activeSupplier.companyName}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(activeSupplier)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Edit
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 pt-3 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{activeSupplier.contactPerson} — {activeSupplier.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="font-mono">{activeSupplier.phone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{activeSupplier.address}</span>
                </p>
                {activeSupplier.notes && (
                  <p className="text-slate-500 pt-1 leading-relaxed">{activeSupplier.notes}</p>
                )}
              </div>

              {/* Supplied Products */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 mb-2">
                  Supplied Products ({activeSupplierProducts.length})
                </h3>
                {activeSupplierProducts.length === 0 ? (
                  <p className="text-xs text-slate-500">No catalog items currently assigned.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeSupplierProducts.map((p) => (
                      <div key={p.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{p.name}</p>
                          <p className="font-mono text-slate-500">{p.sku}</p>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-slate-800 shrink-0">
                          {p.quantity} in stock
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Purchase Orders */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 mb-2">
                  Purchase Orders ({activeSupplierPos.length})
                </h3>
                {activeSupplierPos.length === 0 ? (
                  <p className="text-xs text-slate-500">No purchase orders recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeSupplierPos.map((po) => (
                      <div key={po.id} className="py-2 flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <p className="font-mono font-semibold text-slate-900">
                            {po.poNumber} · {po.status}
                          </p>
                          <p className="text-slate-500 truncate">{po.productName}</p>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <p className="font-semibold text-slate-900">
                            {formatCurrency(po.estimatedCost)}
                          </p>
                          <p className="text-slate-500">ETA {po.expectedDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Recent Activity</span>
                </h3>
                {activeSupplierActivity.length === 0 ? (
                  <p className="text-xs text-slate-500">No recent stock activity recorded.</p>
                ) : (
                  <div className="space-y-1.5 text-xs">
                    {activeSupplierActivity.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between gap-2">
                        <span className="text-slate-700 truncate">
                          {tx.date} · {tx.productName}
                        </span>
                        <span className="font-mono tabular-nums font-semibold text-slate-900 shrink-0">
                          {tx.type === 'stock_in' ? `+${tx.quantityChange}` : `−${tx.quantityChange}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="supplier-form-title"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 id="supplier-form-title" className="font-display text-lg font-bold text-slate-900">
                {editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close supplier form"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  {formError}
                </p>
              )}
              <div>
                <label htmlFor="sup-company" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Name
                </label>
                <input
                  id="sup-company"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sup-contact" className="block text-sm font-medium text-slate-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    id="sup-contact"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>
                <div>
                  <label htmlFor="sup-phone" className="block text-sm font-medium text-slate-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="sup-phone"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sup-email" className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  id="sup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-600"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sup-status" className="block text-sm font-medium text-slate-700 mb-1">
                    Delivery Status
                  </label>
                  <select
                    id="sup-status"
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as SupplierDeliveryStatus)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                  >
                    {DELIVERY_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sup-lead" className="block text-sm font-medium text-slate-700 mb-1">
                    Lead Time (Days)
                  </label>
                  <input
                    id="sup-lead"
                    type="number"
                    min="1"
                    value={leadTimeDays}
                    onChange={(e) => setLeadTimeDays(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="sup-address" className="block text-sm font-medium text-slate-700 mb-1">
                  Warehouse / Office Address
                </label>
                <input
                  id="sup-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="sup-notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  id="sup-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg"
                >
                  {editingSupplier ? 'Save Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={Boolean(deletingSupplier)}
        destructive
        title={`Delete supplier "${deletingSupplier?.companyName}"?`}
        description="Products currently linked to this supplier will remain in your catalog and can be reassigned anytime."
        confirmLabel="Delete Supplier"
        onCancel={() => setDeletingSupplier(null)}
        onConfirm={() => {
          if (deletingSupplier) {
            onDeleteSupplier(deletingSupplier.id);
            setDeletingSupplier(null);
          }
        }}
      />
    </div>
  );
}
