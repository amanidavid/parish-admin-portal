'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel, Badge, ConfirmModal } from '@/components/ui';
import PaymentModal from '@/components/property-subscriptions/PaymentModal';
import { fmt, fmtDate } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

const STATUS_MAP = {
  active: { label: 'Active', cls: 'badge-green' },
  expired: { label: 'Expired', cls: 'badge-red' },
  unsubscribed: { label: 'Unsubscribed', cls: 'badge-gray' },
};

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
      const [subRes, wsRes] = await Promise.allSettled([
        PropertySubscriptionService.index(uuid, { per_page: 15, ...f }),
        WorkspaceService.show(uuid),
      ]);
      if (subRes.status === 'fulfilled' && subRes.value?.data) {
        setSubscriptions(Array.isArray(subRes.value.data) ? subRes.value.data : []);
        setMeta(subRes.value.meta ?? null);
      }
      if (wsRes.status === 'fulfilled') setWorkspace(wsRes.value?.data);
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
                  <td className="text-center"><Skel w="w-16" h="h-7" /></td>
                </tr>
              ))}
              {!loading && subscriptions.length === 0 && (
                <tr><td colSpan={5} className="text-center py-14 text-gray-400 text-sm">No property subscriptions found</td></tr>
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
          onClose={() => setPayModalProperty(null)}
          onSuccess={() => load()}
        />
      )}

    </div>
  );
}
