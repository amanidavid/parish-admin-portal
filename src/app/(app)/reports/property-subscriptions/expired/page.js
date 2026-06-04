'use client';
import { useEffect, useState, useCallback } from 'react';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import { Skel, Badge } from '@/components/ui';
import { fmt, fmtDate, fmtDateTime } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

const STATUS_MAP = {
  expired: { label: 'Expired', color: '#dc2626', bg: '#fee2e2' },
};

export default function ExpiredReportPage() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { showNotification } = useUiStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PropertySubscriptionService.expiredReport({ per_page: 15, page });
      if (res?.data) {
        setRows(Array.isArray(res.data) ? res.data : []);
        setMeta(res.meta ?? null);
      }
    } catch (e) {
      showNotification(e?.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, showNotification]);

  useEffect(() => { load(); }, [load]);

  const handlePage = useCallback((pg) => {
    if (pg < 1 || (meta?.last_page && pg > meta.last_page)) return;
    setPage(pg);
  }, [meta]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Expired Subscriptions</h1>
        <p className="text-sm text-gray-400 mt-0.5">Properties with expired subscription coverage</p>
      </div>

      <div className="data-table-wrap">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[650px]">
            <thead>
              <tr>
                <th>Property</th>
                <th>Workspace</th>
                <th>Status</th>
                <th>Period End</th>
                <th>Units</th>
                <th>Created</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }, (_, i) => (
                <tr key={i}>
                  <td><Skel w="w-28" h="h-3.5" /></td>
                  <td><Skel w="w-24" h="h-3" /></td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-8" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={7} className="text-center py-14 text-gray-400 text-sm">No expired subscriptions found</td></tr>
              )}
              {!loading && rows.map((r) => (
                <tr key={r.property_uuid || r.uuid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#dc2626,#f87171)' }}>
                        {(r.property_name || r.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{r.property_name || r.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{r.property_uuid?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm text-gray-700">{r.workspace_display_name || r.workspace_name || '—'}</td>
                  <td><Badge map={STATUS_MAP} value="expired" /></td>
                  <td className="text-xs text-gray-500">{fmtDate(r.current_period_ends_on)}</td>
                  <td className="text-center text-sm text-gray-700">{fmt(r.current_registered_units_total)}</td>
                  <td className="text-xs text-gray-500">{fmtDateTime(r.created_at ?? r.createdAt)}</td>
                  <td className="text-xs text-gray-500">{fmtDateTime(r.updated_at ?? r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta?.last_page > 1 && (
          <div className="table-pagination">
            <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Prev</button>
            <span className="text-sm text-gray-500">Page {page} of {meta.last_page}</span>
            <button onClick={() => handlePage(page + 1)} disabled={page >= meta.last_page}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
