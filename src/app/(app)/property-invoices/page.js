'use client';
import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react';
import PropertyInvoiceService from '@/services/PropertyInvoiceService';
import { Skel, Badge, ConfirmModal } from '@/components/ui';
import { fmtDate } from '@/lib/formatters';
import ResendModal from '@/components/property-invoices/ResendModal';

const INVOICE_STATUS_MAP = {
  pending: { label: 'Pending', cls: 'badge-amber' },
  sent: { label: 'Sent', cls: 'badge-green' },
  failed: { label: 'Failed', cls: 'badge-red' },
  paid: { label: 'Paid', cls: 'badge-blue' },
};

function PropertyInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendMode, setResendMode] = useState('single'); // 'single' | 'bulk'
  const [resendTarget, setResendTarget] = useState(null);

  const [filters, setFilters] = useState({ status: '', search: '', page: 1, date_from: '', date_to: '' });
  const searchDebRef = useRef(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  const fetchInvoices = useCallback(async (f) => {
    setLoading(true);
    const data = await PropertyInvoiceService.index({
      per_page: 15,
      page: f.page,
      ...(f.status ? { status: f.status } : {}),
      ...(f.search ? { search: f.search } : {}),
      ...(f.date_from ? { date_from: f.date_from } : {}),
      ...(f.date_to ? { date_to: f.date_to } : {}),
    });
    if (data?.data) {
      setInvoices(data.data);
      setMeta(data.meta);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvoices(filters); }, [filters, fetchInvoices]);

  const handleStatus = useCallback((e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  }, []);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, search: val, page: 1 }));
    clearTimeout(searchDebRef.current);
    searchDebRef.current = setTimeout(() => {
      fetchInvoices({ ...filters, search: val, page: 1 });
    }, 350);
  }, [filters, fetchInvoices]);

  const handleDateChange = useCallback((field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  }, []);

  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const handleDeselectAll = useCallback(() => {
    setSelected(new Set());
    setSelectAll(false);
  }, []);

  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, filters.page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, filters.page]);

  const handleSelectAll = useCallback((e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelected(new Set(invoices.map((inv) => inv.uuid)));
    } else {
      setSelected(new Set());
    }
  }, [invoices]);

  const handleSelectOne = useCallback((uuid) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uuid)) {
        next.delete(uuid);
      } else {
        next.add(uuid);
      }
      return next;
    });
  }, []);

  const handleResendSingle = useCallback((invoice) => {
    setResendMode('single');
    setResendTarget(invoice);
    setResendOpen(true);
  }, []);

  const handleResendBulk = useCallback(() => {
    if (selected.size === 0) return;
    // Validate selected invoices
    const selectedInvoices = invoices.filter((inv) => selected.has(inv.uuid));
    const invalidInvoices = selectedInvoices.filter((inv) => inv.status === 'paid');
    if (invalidInvoices.length > 0) {
      setConfirmResult({ type: 'error', message: `Cannot resend ${invalidInvoices.length} paid invoice${invalidInvoices.length > 1 ? 's' : ''}. Please deselect paid invoices.` });
      setConfirmOpen(true);
      return;
    }
    setConfirmResult(null);
    setConfirmOpen(true);
  }, [selected, invoices]);

  const handleConfirmBulk = useCallback(() => {
    setConfirmOpen(false);
    setResendMode('bulk');
    setResendTarget(null);
    setResendOpen(true);
  }, []);

  const handleCancelBulk = useCallback(() => {
    setConfirmOpen(false);
    setConfirmResult(null);
  }, []);

  const handleResendSuccess = useCallback(() => {
    setResendOpen(false);
    setSelected(new Set());
    setSelectAll(false);
    fetchInvoices(filters);
  }, [filters, fetchInvoices]);

  const selectedCount = useMemo(() => selected.size, [selected.size]);
  const hasSelection = useMemo(() => selectedCount > 0, [selectedCount]);
  const selectedInvoices = useMemo(() => invoices.filter((inv) => selected.has(inv.uuid)), [invoices, selected]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Property Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage invoice reminders and delivery</p>
        </div>
        {hasSelection && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeselectAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Deselect All
            </button>
            <button
              onClick={handleResendBulk}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Resend {selectedCount} Invoice{selectedCount !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <div className="table-toolbar">
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filters.status} onChange={handleStatus} className="input table-filter-select py-2 text-sm">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="paid">Paid</option>
            </select>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search invoice number or recipient…"
                value={filters.search}
                onChange={handleSearch}
                className="input pl-8 py-2 text-sm w-64"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleDateChange('date_from', e.target.value)}
                className="input py-2 text-sm"
                placeholder="Date From"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleDateChange('date_to', e.target.value)}
                className="input py-2 text-sm"
                placeholder="Date To"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selectAll && invoices.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th>Invoice Number</th>
                <th>Property</th>
                <th>Recipient</th>
                <th>Due Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i}>
                  <td><Skel w="w-4" h="h-4" /></td>
                  <td><Skel w="w-24" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-28" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td className="text-right"><Skel w="w-12" h="h-7" /></td>
                </tr>
              ))}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14 text-gray-400 text-sm">No invoices found</td></tr>
              )}
              {!loading && invoices.map((inv) => (
                <tr key={inv.uuid}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(inv.uuid)}
                      onChange={() => handleSelectOne(inv.uuid)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="text-sm text-gray-900 font-medium">{inv.invoice_number || '—'}</td>
                  <td className="text-sm text-gray-700">{inv.property_name || '—'}</td>
                  <td className="text-sm text-gray-700">{inv.recipient_address || '—'}</td>
                  <td className="text-xs text-gray-500">{fmtDate(inv.due_date)}</td>
                  <td><Badge map={INVOICE_STATUS_MAP} value={inv.status} /></td>
                  <td className="text-right">
                    <button
                      onClick={() => handleResendSingle(inv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors">
                      Resend
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden space-y-3">
          {loading && Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skel w="w-4" h="h-4" />
                <Skel w="w-24" h="h-3" />
              </div>
              <Skel w="w-full" h="h-3" />
              <Skel w="w-3/4" h="h-3" />
              <Skel w="w-1/2" h="h-3" />
            </div>
          ))}
          {!loading && invoices.length === 0 && (
            <div className="text-center py-14 text-gray-400 text-sm">No invoices found</div>
          )}
          {!loading && invoices.map((inv) => (
            <div key={inv.uuid} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selected.has(inv.uuid)}
                    onChange={() => handleSelectOne(inv.uuid)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-semibold text-gray-900">{inv.invoice_number || '—'}</span>
                </div>
                <Badge map={INVOICE_STATUS_MAP} value={inv.status} />
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-700"><span className="text-gray-400">Property:</span> {inv.property_name || '—'}</p>
                <p className="text-gray-700"><span className="text-gray-400">Recipient:</span> {inv.recipient_address || '—'}</p>
                <p className="text-gray-500"><span className="text-gray-400">Due:</span> {fmtDate(inv.due_date)}</p>
              </div>
              <button
                onClick={() => handleResendSingle(inv)}
                className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors"
              >
                Resend
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {pageNums.length > 0 && (
          <div className="table-pagination">
            <p className="text-xs text-gray-400">Showing {meta.from}–{meta.to} of {meta.total} invoices</p>
            <div className="table-pagination-pages">
              <button onClick={() => handlePage(Math.max(1, filters.page - 1))} disabled={filters.page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {pageNums.map((pg) => (
                <button key={pg} onClick={() => handlePage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === filters.page ? 'bg-primary-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{pg}</button>
              ))}
              <button onClick={() => handlePage(Math.min(meta.last_page, filters.page + 1))} disabled={filters.page === meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </div>

      <ResendModal
        open={resendOpen}
        onClose={() => setResendOpen(false)}
        onSuccess={handleResendSuccess}
        mode={resendMode}
        target={resendTarget}
        selectedUuids={Array.from(selected)}
      />
      <ConfirmModal
        open={confirmOpen}
        onClose={handleCancelBulk}
        onConfirm={handleConfirmBulk}
        title="Confirm Bulk Resend"
        message={`Resend reminders for ${selectedCount} invoice${selectedCount !== 1 ? 's' : ''}?`}
        confirmLabel="Resend"
        result={confirmResult}
      />
    </div>
  );
}

export default memo(PropertyInvoicesPage);
