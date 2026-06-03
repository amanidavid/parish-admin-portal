'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import BillingService from '@/services/BillingService';
import { Skel, Badge, StatCard } from '@/components/ui';
import { BILLING_STATUS_MAP, INTERVAL_MAP } from '@/constants/status';

export default function BillingProfilesPage() {
  const [profiles, setProfiles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0, default: 0 });

  const [inputSearch, setInputSearch] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', interval: '', page: 1 });

  const fetchProfiles = useCallback(async (f) => {
    setLoading(true);
    const data = await BillingService.index({
      per_page: 15,
      page: f.page,
      ...(f.search ? { search: f.search } : {}),
      ...(f.status ? { status: f.status } : {}),
      ...(f.interval ? { billing_interval: f.interval } : {}),
    });
    if (data?.data) {
      setProfiles(data.data);
      setMeta(data.meta);
      if (f.page === 1 && !f.search && !f.status && !f.interval) {
        setCounts((prev) => ({ ...prev, total: data.meta?.total ?? prev.total }));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfiles(filters); }, [filters, fetchProfiles]);

  // Load counts once on mount — total is derived from the main list fetch
  useEffect(() => {
    Promise.allSettled([
      BillingService.index({ per_page: 1, status: 'active' }),
      BillingService.index({ per_page: 1, status: 'inactive' }),
      BillingService.index({ per_page: 1, is_default: 1 }),
    ]).then(([a, i, d]) => {
      const g = (r) => r.status === 'fulfilled' ? (r.value?.meta?.total ?? 0) : 0;
      setCounts((prev) => ({ ...prev, active: g(a), inactive: g(i), default: g(d) }));
    });
  }, []);

  const applySearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: inputSearch.trim(), page: 1 }));
  }, [inputSearch]);

  const clearSearch = useCallback(() => {
    setInputSearch('');
    setFilters((prev) => ({ ...prev, search: '', page: 1 }));
  }, []);

  const handleSearchKey = useCallback((e) => {
    if (e.key === 'Enter') applySearch();
  }, [applySearch]);

  const handleStatus = useCallback((e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  }, []);

  const handleInterval = useCallback((e) => {
    setFilters((prev) => ({ ...prev, interval: e.target.value, page: 1 }));
  }, []);

  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, filters.page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, filters.page]);

  const fmtAmt = (cents, currency) => {
    if (cents == null) return '—';
    return `${currency || 'TZS'} ${new Intl.NumberFormat('en-US').format(cents / 100)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing Profiles</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage pricing plans and billing rules</p>
        </div>
        <Link
          href="/billing/create"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={counts.total}
          icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          color="#0891b2" bg="#ecfeff" />
        <StatCard label="Active" value={counts.active}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Inactive" value={counts.inactive}
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          color="#dc2626" bg="#fef2f2" />
        <StatCard label="Default" value={counts.default}
          icon="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          color="#d97706" bg="#fffbeb" />
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        {/* Filter bar */}
        <div className="table-toolbar">
          <div className="table-toolbar-search-group">
            <div className="table-search-field">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text" placeholder="Search..." value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)} onKeyDown={handleSearchKey}
                className="input pl-8 pr-7 py-2 text-sm w-full"
              />
              {inputSearch && (
                <button onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" title="Clear search">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button onClick={applySearch}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90 self-stretch sm:self-auto"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              Search
            </button>
          </div>

          <select value={filters.status} onChange={handleStatus} className="input table-filter-select py-2 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select value={filters.interval} onChange={handleInterval} className="input table-filter-select py-2 text-sm sm:min-w-[140px]">
            <option value="">All Intervals</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Interval</th>
              <th>Trial / Grace</th>
              <th>Currency</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                    <div className="space-y-1.5"><Skel w="w-28" h="h-3.5" /><Skel w="w-20" h="h-2.5" /></div>
                  </div>
                </td>
                <td><Skel w="w-16" h="h-5" /></td>
                <td><Skel w="w-20" h="h-3" /></td>
                <td><Skel w="w-10" h="h-3" /></td>
                <td><Skel w="w-14" h="h-5" /></td>
                <td className="text-right"><Skel w="w-12" h="h-7" /></td>
              </tr>
            ))}
            {!loading && profiles.length === 0 && (
              <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No billing profiles found</td></tr>
            )}
            {!loading && profiles.map((p) => (
              <tr key={p.uuid}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
                      {(p.name || 'B').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{p.description || 'No description'}</p>
                    </div>
                  </div>
                </td>
                <td><Badge map={INTERVAL_MAP} value={p.billing_interval} /></td>
                <td className="text-xs text-gray-500">{p.trial_days}d / {p.grace_days}d</td>
                <td className="text-xs text-gray-500 font-mono">{p.currency}</td>
                <td><Badge map={BILLING_STATUS_MAP} value={p.status} /></td>
                <td className="text-right">
                  <Link href={`/billing/${p.uuid}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors">
                    View
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pageNums.length > 0 && (
          <div className="table-pagination">
            <p className="text-xs text-gray-400">Showing {meta.from}–{meta.to} of {meta.total} profiles</p>
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
    </div>
  );
}
