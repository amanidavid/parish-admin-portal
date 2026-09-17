'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import HistoricalContractGrantService from '@/services/HistoricalContractGrantService';
import HistoricalContractGrantModal from '@/components/workspaces/HistoricalContractGrantModal';
import GrantRevokeModal from '@/components/workspaces/GrantRevokeModal';
import GrantDetailsModal from '@/components/workspaces/GrantDetailsModal';
import { Skel, Badge } from '@/components/ui';
import { fmt, fmtDate, fmtDateTime } from '@/lib/formatters';
import { GRANT_STATUS_MAP } from '@/constants/status';

const PER_PAGE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'created_at', label: 'Oldest' },
  { value: 'expires_at', label: 'Expires (soonest)' },
  { value: '-expires_at', label: 'Expires (latest)' },
];

// ─── Grants Table ─────────────────────────────────────────────────────────────
function GrantsTable({ rows, meta, loading, onPage, onView, onRevoke }) {
  const page = meta?.current_page ?? 1;
  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, page]);

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Contract Period</th>
            <th>Expires</th>
            <th>Status</th>
            <th>Reason</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 5 }, (_, i) => (
            <tr key={i}>
              <td><Skel w="w-28" h="h-3" /></td>
              <td><Skel w="w-24" h="h-3" /></td>
              <td><Skel w="w-14" h="h-5" /></td>
              <td><Skel w="w-24" h="h-3" /></td>
              <td className="text-right"><Skel w="w-16" h="h-7" /></td>
            </tr>
          ))}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                No contract entry grants found
              </td>
            </tr>
          )}

          {!loading && rows.map((row) => {
            // effective_status is the computed real-time state (active|expired|revoked);
            // fall back to stored status when the API omits effective_status.
            const liveStatus = row.effective_status || row.status;
            const canRevoke = liveStatus === 'active';
            const period = row.historical_start_date_from && row.historical_start_date_to
              ? `${fmtDate(row.historical_start_date_from)} → ${fmtDate(row.historical_start_date_to)}`
              : '—';
            return (
              <tr key={row.uuid}>
                <td className="text-xs text-gray-600">{period}</td>
                <td className="text-xs text-gray-500">{row.expires_at ? fmtDateTime(row.expires_at) : '—'}</td>
                <td><Badge map={GRANT_STATUS_MAP} value={liveStatus} /></td>
                <td>
                  <button
                    onClick={() => onView(row)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                  >
                    View
                  </button>
                </td>
                <td className="text-right">
                  {canRevoke ? (
                    <button
                      onClick={() => onRevoke(row)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                      title="Revoke grant"
                    >
                      Revoke
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pageNums.length > 0 && (
        <div className="table-pagination">
          <p className="text-xs text-gray-400">
            Showing {meta.from}–{meta.to} of {fmt(meta.total)}
          </p>
          <div className="table-pagination-pages">
            <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              ← Prev
            </button>
            {pageNums.map((pg) => (
              <button key={pg} onClick={() => onPage(pg)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-primary-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                {pg}
              </button>
            ))}
            <button onClick={() => onPage(Math.min(meta.last_page, page + 1))} disabled={page === meta.last_page}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoricalContractGrantsPage() {
  const { uuid } = useParams();

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', sort: '-created_at', page: 1 });

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const loadTable = useCallback(async (f) => {
    setLoading(true);
    const res = await HistoricalContractGrantService.index(uuid, {
      per_page: PER_PAGE,
      page: f.page,
      sort: f.sort,
      ...(f.status ? { status: f.status } : {}),
    });
    if (res?.success) {
      setRows(Array.isArray(res.data) ? res.data : []);
      setMeta(res.meta ?? null);
    }
    setLoading(false);
  }, [uuid]);

  useEffect(() => {
    loadTable(filters);
  }, [loadTable, filters]);

  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const handleFilter = useCallback((key) => (e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, [key]: val, page: 1 }));
  }, []);

  const handleCreated = useCallback(() => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadTable({ ...filters, page: 1 });
    setCreateOpen(false);
  }, [filters, loadTable]);

  const handleRevoked = useCallback(() => {
    loadTable(filters);
    setRevokeTarget(null);
  }, [filters, loadTable]);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href={`/workspaces/${uuid}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workspace
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Contract Entry Grants</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Allow a user to enter contracts with a past start date after the trial has expired
          </p>
        </div>
        <button onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Grant
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-gray-400">{meta ? `${fmt(meta.total)} grants` : 'Loading…'}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filters.status} onChange={handleFilter('status')} className="input py-1.5 text-xs w-32">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={filters.sort} onChange={handleFilter('sort')} className="input py-1.5 text-xs w-40">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <GrantsTable
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={handlePage}
        onView={setViewTarget}
        onRevoke={setRevokeTarget}
      />

      {/* Create modal */}
      <HistoricalContractGrantModal
        tenantUuid={uuid}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreated}
      />

      {/* Details modal */}
      <GrantDetailsModal
        grant={viewTarget}
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
      />

      {/* Revoke modal */}
      <GrantRevokeModal
        tenantUuid={uuid}
        grant={revokeTarget}
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onSuccess={handleRevoked}
      />
    </div>
  );
}
