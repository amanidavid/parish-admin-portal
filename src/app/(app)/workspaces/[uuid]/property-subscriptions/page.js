'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import WorkspaceService from '@/services/WorkspaceService';
import BillingService from '@/services/BillingService';
import { Skel, Badge, ConfirmModal } from '@/components/ui';
import { fmt, fmtCents, fmtDate } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

const STATUS_MAP = {
  active: { label: 'Active', cls: 'badge-green' },
  expired: { label: 'Expired', cls: 'badge-red' },
  unsubscribed: { label: 'Unsubscribed', cls: 'badge-gray' },
};

// ─── Payment Modal ──────────────────────────────────────────────────────────
function PaymentModal({ workspaceUuid, property, billingRules, onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // form | preview | recording | success | error
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const { showNotification } = useUiStore();

  const [form, setForm] = useState({
    property_uuid: property?.property_uuid || '',
    billing_rule_uuid: '',
    months_paid: 1,
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
  });

  const handlePreview = useCallback(async () => {
    if (!form.billing_rule_uuid || !form.months_paid || !form.payment_date) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }
    setStep('previewing');
    try {
      const res = await PropertySubscriptionService.previewPayment(workspaceUuid, {
        property_uuid: form.property_uuid,
        billing_rule_uuid: form.billing_rule_uuid,
        months_paid: parseInt(form.months_paid, 10),
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        notes: form.notes,
      }, { showLoader: false });
      if (res?.success && res.data) {
        setPreview(res.data);
        setStep('preview');
      } else {
        throw new Error(res?.message || 'Preview failed');
      }
    } catch (e) {
      setError(e?.message || 'Failed to preview payment');
      setStep('error');
    }
  }, [form, workspaceUuid, showNotification]);

  const handleRecord = useCallback(async () => {
    setStep('recording');
    try {
      const res = await PropertySubscriptionService.recordPayment(workspaceUuid, {
        property_uuid: form.property_uuid,
        billing_rule_uuid: form.billing_rule_uuid,
        months_paid: parseInt(form.months_paid, 10),
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        notes: form.notes,
      }, { showLoader: false });
      if (res?.success) {
        setStep('success');
        showNotification('Payment recorded successfully.', 'success');
        onSuccess?.();
      } else {
        throw new Error(res?.message || 'Failed to record payment');
      }
    } catch (e) {
      setError(e?.message || 'Failed to record payment');
      setStep('error');
    }
  }, [form, workspaceUuid, onSuccess, showNotification]);

  const resetForm = useCallback(() => {
    setPreview(null);
    setError(null);
    setForm({
      property_uuid: property?.property_uuid || '',
      billing_rule_uuid: '',
      months_paid: 1,
      payment_date: new Date().toISOString().split('T')[0],
      reference_number: '',
      notes: '',
    });
    setStep('form');
  }, [property]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {step === 'success' ? 'Payment Recorded' : 'Record Payment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'form' && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">{property?.name}</p>
                <p className="text-gray-500">Units: {fmt(property?.current_registered_units_total)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing Rule <span className="text-red-500">*</span></label>
                  <select
                    value={form.billing_rule_uuid}
                    onChange={(e) => setForm((p) => ({ ...p, billing_rule_uuid: e.target.value }))}
                    className="input w-full text-sm py-2"
                  >
                    <option value="">Select billing rule</option>
                    {billingRules?.map((r) => (
                      <option key={r.uuid} value={r.uuid}>
                        {r.profile_name || 'Rule'} — {r.range_start}-{r.range_end ?? '∞'} units @ {fmtCents(r.price_cents, r.currency)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Months Paid <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.months_paid}
                    onChange={(e) => setForm((p) => ({ ...p, months_paid: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={form.reference_number}
                    onChange={(e) => setForm((p) => ({ ...p, reference_number: e.target.value }))}
                    className="input w-full text-sm py-2"
                    placeholder="e.g. RCPT-1001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="input w-full text-sm py-2 min-h-[80px]"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handlePreview}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Preview Payment
                </button>
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}

          {(step === 'previewing' || step === 'recording') && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500">{step === 'previewing' ? 'Generating preview...' : 'Recording payment...'}</p>
            </div>
          )}

          {step === 'preview' && preview && (
            <>
              <div className="space-y-3">
                <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Price</span>
                    <span className="font-semibold text-gray-900">{fmtCents(preview.payment?.monthly_price_cents, preview.billing_rule?.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Months Paid</span>
                    <span className="font-semibold text-gray-900">{preview.payment?.months_paid}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Total Amount</span>
                    <span className="font-bold text-lg text-orange-600">{fmtCents(preview.payment?.total_amount_cents, preview.billing_rule?.currency)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coverage Start</span>
                    <span className="font-medium text-gray-800">{fmtDate(preview.coverage?.starts_on)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coverage End</span>
                    <span className="font-medium text-gray-800">{fmtDate(preview.coverage?.ends_on)}</span>
                  </div>
                  {preview.coverage?.starts_from_payment_date && (
                    <p className="text-xs text-amber-600">Coverage starts from payment date</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-500 text-xs mb-1">Subscription After</p>
                  <p className="font-medium text-gray-800">{preview.subscription_after?.effective_status}</p>
                  <p className="text-xs text-gray-400">Until {fmtDate(preview.subscription_after?.current_period_ends_on)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleRecord}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                  Confirm & Record
                </button>
                <button onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Back
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-3 text-base font-semibold text-gray-900">Payment Recorded</p>
              <p className="mt-1 text-sm text-gray-500">The subscription has been updated successfully.</p>
              <button onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-3 text-base font-semibold text-gray-900">Error</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Retry
                </button>
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function PropertySubscriptionsPage() {
  const params = useParams();
  const uuid = params?.uuid;

  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', subscription_status: '', page: 1 });
  const [inputSearch, setInputSearch] = useState('');
  const [workspace, setWorkspace] = useState(null);
  const [billingRules, setBillingRules] = useState([]);

  const [payModalProperty, setPayModalProperty] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);

  const abortRef = useRef(null);
  const { showNotification } = useUiStore();

  const load = useCallback(async (f = filters) => {
    if (!uuid) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [subRes, wsRes, brRes] = await Promise.allSettled([
        PropertySubscriptionService.index(uuid, { per_page: 15, ...f }),
        WorkspaceService.show(uuid),
        BillingService.billingRules({ status: 'active', effective_on: today, per_page: 50 }),
      ]);
      if (subRes.status === 'fulfilled' && subRes.value?.data) {
        setSubscriptions(Array.isArray(subRes.value.data) ? subRes.value.data : []);
        setMeta(subRes.value.meta ?? null);
      }
      if (wsRes.status === 'fulfilled') setWorkspace(wsRes.value?.data);
      if (brRes.status === 'fulfilled') setBillingRules(Array.isArray(brRes.value?.data) ? brRes.value.data : []);
    } catch (e) {
      showNotification(e?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [uuid, filters, showNotification]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uuid, filters.page, filters.subscription_status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputSearch !== filters.search) {
        setFilters((p) => ({ ...p, search: inputSearch, page: 1 }));
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputSearch, filters.search]);

  const handlePage = useCallback((pg) => {
    if (pg < 1 || (meta?.last_page && pg > meta.last_page)) return;
    setFilters((p) => ({ ...p, page: pg }));
  }, [meta]);

  const handleStatusFilter = useCallback((e) => {
    setFilters((p) => ({ ...p, subscription_status: e.target.value, page: 1 }));
  }, []);

  const clearSearch = useCallback(() => {
    setInputSearch('');
    setFilters((p) => ({ ...p, search: '', page: 1 }));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-gray-300">|</span>
          <Link href={`/workspaces/${uuid}`} className="hover:text-gray-800 transition-colors">Workspace</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Property Subscriptions</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Property Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-0.5">{workspace?.display_name || workspace?.name || 'Workspace'}</p>
      </div>

      {/* Filters */}
      <div className="data-table-wrap">
        <div className="table-toolbar flex-wrap gap-2">
          <div className="table-toolbar-search-group">
            <div className="table-search-field">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search properties..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                className="input pl-8 pr-7 py-2 text-sm w-full"
              />
              {inputSearch && (
                <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <select value={filters.subscription_status} onChange={handleStatusFilter} className="input table-filter-select py-2 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table min-w-[700px]">
            <thead>
              <tr>
                <th>Property</th>
                <th className="text-center">Units</th>
                <th>Subscription</th>
                <th>Period End</th>
                <th>Payments</th>
                <th>Total Paid</th>
                <th>Created</th>
                <th>Updated</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i}>
                  <td><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" /><div className="space-y-1.5"><Skel w="w-28" h="h-3.5" /><Skel w="w-20" h="h-2.5" /></div></div></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-8" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td className="text-center"><Skel w="w-16" h="h-7" /></td>
                </tr>
              ))}
              {!loading && subscriptions.length === 0 && (
                <tr><td colSpan={9} className="text-center py-14 text-gray-400 text-sm">No property subscriptions found</td></tr>
              )}
              {!loading && subscriptions.map((s, i) => (
                <tr key={s.property_uuid || `sub-${i}`}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                        {(s.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-center text-sm text-gray-700">{fmt(s.current_registered_units_total)}</td>
                  <td>
                    <Badge map={STATUS_MAP} value={s.subscription?.effective_status || s.subscription?.status || 'unsubscribed'} />
                  </td>
                  <td className="text-xs text-gray-500">
                    {fmtDate(s.subscription?.current_period_ends_on) || '—'}
                  </td>
                  <td className="text-sm text-gray-700">{fmt(s.payment_summary?.payments_count ?? 0)}</td>
                  <td className="text-sm font-medium text-gray-900">{fmtCents(s.payment_summary?.total_paid_amount_cents ?? 0)}</td>
                  <td className="text-xs text-gray-500">{fmtDate(s.created_at ?? s.createdAt)}</td>
                  <td className="text-xs text-gray-500">{fmtDate(s.updated_at ?? s.updatedAt)}</td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/workspaces/${uuid}/property-subscriptions/${s.property_uuid}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Details
                      </Link>
                      <button onClick={() => setPayModalProperty(s)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                        Pay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta?.last_page > 1 && (
          <div className="table-pagination">
            <button onClick={() => handlePage(filters.page - 1)} disabled={filters.page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Prev
            </button>
            <span className="text-sm text-gray-500">Page {filters.page} of {meta.last_page}</span>
            <button onClick={() => handlePage(filters.page + 1)} disabled={filters.page >= meta.last_page}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payModalProperty && (
        <PaymentModal
          workspaceUuid={uuid}
          property={payModalProperty}
          billingRules={billingRules}
          onClose={() => setPayModalProperty(null)}
          onSuccess={() => load()}
        />
      )}

    </div>
  );
}
