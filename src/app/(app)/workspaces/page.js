'use client';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel, Badge, StatCard } from '@/components/ui';
import { WORKSPACE_STATUS_MAP, PROV_MAP } from '@/constants/status';

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, active: 0, suspended: 0, failed: 0 });

  const [inputSearch, setInputSearch] = useState('');
  const [filters, setFilters] = useState({ search: '', status: '', provStatus: '', page: 1 });

  const abortRef = useRef(null);

  // Stable fetch — takes explicit params, no stale-closure risk
  const fetchWorkspaces = useCallback(async (f) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    const data = await WorkspaceService.index({
      per_page: 15,
      page: f.page,
      ...(f.search ? { search: f.search } : {}),
      ...(f.status ? { status: f.status } : {}),
      ...(f.provStatus ? { provisioning_status: f.provStatus } : {}),
    });
    if (data?.data) {
      setWorkspaces(data.data);
      setMeta(data.meta);
      if (f.page === 1 && !f.search && !f.status && !f.provStatus) {
        setCounts((prev) => ({ ...prev, total: data.meta?.total ?? prev.total }));
      }
    }
    setLoading(false);
  }, []);

  // Fire when filters change
  useEffect(() => { fetchWorkspaces(filters); }, [filters, fetchWorkspaces]);

  // Load counts once on mount — total is derived from the main list fetch
  useEffect(() => {
    Promise.allSettled([
      WorkspaceService.index({ per_page: 1, status: 'active' }),
      WorkspaceService.index({ per_page: 1, status: 'suspended' }),
      WorkspaceService.index({ per_page: 1, provisioning_status: 'failed' }),
    ]).then(([a, s, f]) => {
      const g = (r) => r.status === 'fulfilled' ? (r.value?.meta?.total ?? 0) : 0;
      setCounts((prev) => ({ ...prev, active: g(a), suspended: g(s), failed: g(f) }));
    });
  }, []);

  // Handlers — all stable
  const applySearch = useCallback(() => {
    setFilters((prev) => ({ ...prev, search: inputSearch.trim(), page: 1 }));
  }, [inputSearch]);

  const handleSearchKey = useCallback((e) => {
    if (e.key === 'Enter') applySearch();
  }, [applySearch]);

  const clearSearch = useCallback(() => {
    setInputSearch('');
    setFilters((prev) => ({ ...prev, search: '', page: 1 }));
  }, []);

  const handleStatus = useCallback((e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  }, []);

  const handleProv = useCallback((e) => {
    setFilters((prev) => ({ ...prev, provStatus: e.target.value, page: 1 }));
  }, []);

  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, filters.page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, filters.page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Workspaces</h1>
        <p className="text-sm text-gray-400 mt-0.5">Monitor and manage all registered workspaces</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={counts.total}
          icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          color="#ea580c" bg="#fff7ed" />
        <StatCard label="Active" value={counts.active}
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          color="#16a34a" bg="#f0fdf4" />
        <StatCard label="Suspended" value={counts.suspended}
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          color="#dc2626" bg="#fef2f2" />
        <StatCard label="Prov. Failed" value={counts.failed}
          icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          color="#d97706" bg="#fffbeb" />
      </div>

      {/* Filters + table */}
      <div className="data-table-wrap">
        {/* Filter bar */}
        <div className="table-toolbar">
          {/* Search input + clear + search button */}
          <div className="table-toolbar-search-group">
            <div className="table-search-field">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search..."
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
                onKeyDown={handleSearchKey}
                className="input pl-8 pr-7 py-2 text-sm w-full"
              />
              {inputSearch && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={applySearch}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90 self-stretch sm:self-auto"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
            >
              Search
            </button>
          </div>

          <select value={filters.status} onChange={handleStatus} className="input table-filter-select py-2 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select value={filters.provStatus} onChange={handleProv} className="input table-filter-select py-2 text-sm sm:min-w-[160px]">
            <option value="">All Provisioning</option>
            <option value="ready">Ready</option>
            <option value="provisioning">Provisioning</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Database</th>
              <th>Status</th>
              <th>Provisioning</th>
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
                <td><Skel w="w-28" h="h-3" /></td>
                <td><Skel w="w-14" h="h-5" /></td>
                <td><Skel w="w-20" h="h-5" /></td>
                <td className="text-right"><Skel w="w-12" h="h-7" /></td>
              </tr>
            ))}
            {!loading && workspaces.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-gray-400 text-sm">
                  No workspaces found
                </td>
              </tr>
            )}
            {!loading && workspaces.map((t) => (
              <tr key={t.uuid}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                      {(t.display_name || t.name || 'W').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{t.display_name || t.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{t.name}</p>
                    </div>
                  </div>
                </td>
                <td className="text-xs text-gray-500 font-mono">{t.database || '—'}</td>
                <td><Badge map={WORKSPACE_STATUS_MAP} value={t.status} /></td>
                <td><Badge map={PROV_MAP} value={t.provisioning_status} /></td>
                <td className="text-right">
                  <Link href={`/workspaces/${t.uuid}`}
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

        {/* Pagination */}
        {pageNums.length > 0 && (
          <div className="table-pagination">
            <p className="text-xs text-gray-400">
              Showing {meta.from}–{meta.to} of {meta.total} workspaces
            </p>
            <div className="table-pagination-pages">
              <button onClick={() => handlePage(Math.max(1, filters.page - 1))} disabled={filters.page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                ← Prev
              </button>
              {pageNums.map((p) => (
                <button key={p} onClick={() => handlePage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === filters.page ? 'bg-primary-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => handlePage(Math.min(meta.last_page, filters.page + 1))} disabled={filters.page === meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
