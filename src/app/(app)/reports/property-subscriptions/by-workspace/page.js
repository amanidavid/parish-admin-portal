'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import Link from 'next/link';
import { Skel, StatCard } from '@/components/ui';
import { fmt, fmtDateTime, fmtCents } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

export default function ByWorkspaceReportPage() {
  const router = useRouter();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', page: 1 });
  const { showNotification } = useUiStore();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await PropertySubscriptionService.byWorkspaceReport({
        per_page: 15,
        ...filters,
      });
      if (res?.data) setReport(res.data);
    } catch (e) {
      showNotification(e?.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, showNotification]);

  useEffect(() => { load(); }, [load]);

  const totals = report?.totals;
  const rows = report?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Property Subscriptions by Workspace</h1>
        <p className="text-sm text-gray-400 mt-0.5">Workspace-level subscription and payment overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Workspaces" value={totals?.workspaces_count} icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" color="#ea580c" bg="#fff7ed" />
        <StatCard label="Active" value={totals?.active_subscribed_properties} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="#16a34a" bg="#dcfce7" />
        <StatCard label="Expired" value={totals?.expired_properties} icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#dc2626" bg="#fee2e2" />
        <StatCard label="Unsubscribed" value={totals?.unsubscribed_properties} icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" color="#6b7280" bg="#f3f4f6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Total Properties" value={totals?.total_properties} icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" color="#2563eb" bg="#dbeafe" />
        <StatCard label="Payments" value={totals?.payments_count} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="#0891b2" bg="#cffafe" />
        <StatCard label="Collected" value={fmtCents(totals?.total_collected_amount_cents)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#9333ea" bg="#f3e8ff" />
      </div>

      {/* Date filter */}
      <div className="data-table-wrap">
        <div className="table-toolbar flex-wrap gap-2">
          <div className="flex gap-2 items-center">
            <input type="date" value={filters.start_date} onChange={(e) => setFilters((p) => ({ ...p, start_date: e.target.value, page: 1 }))} className="input py-2 text-sm" />
            <span className="text-sm text-gray-400">to</span>
            <input type="date" value={filters.end_date} onChange={(e) => setFilters((p) => ({ ...p, end_date: e.target.value, page: 1 }))} className="input py-2 text-sm" />
          </div>
          <button onClick={load}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
            Apply
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table min-w-[750px]">
            <thead>
              <tr>
                <th>Workspace</th>
                <th className="text-center">Properties</th>
                <th className="text-center">Active</th>
                <th className="text-center">Expired</th>
                <th className="text-center">Unsubscribed</th>
                <th className="text-center">Payments</th>
                <th className="text-right">Collected</th>
                <th>Created</th>
                <th>Updated</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td><Skel w="w-32" h="h-3.5" /></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td className="text-center"><Skel w="w-8" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-20" h="h-3" /></td>
                  <td><Skel w="w-12" h="h-3" /></td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={10} className="text-center py-14 text-gray-400 text-sm">No data found</td></tr>
              )}
              {!loading && rows.map((r, i) => (
                <tr key={r.workspace_uuid || `row-${i}`}>
                  <td>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{r.workspace_display_name}</p>
                    </div>
                  </td>
                  <td className="text-center text-sm text-gray-700">{fmt(r.total_properties)}</td>
                  <td className="text-center text-sm text-green-600 font-medium">{fmt(r.active_subscribed_properties)}</td>
                  <td className="text-center text-sm text-red-600 font-medium">{fmt(r.expired_properties)}</td>
                  <td className="text-center text-sm text-gray-500">{fmt(r.unsubscribed_properties)}</td>
                  <td className="text-center text-sm text-gray-700">{fmt(r.payments_count)}</td>
                  <td className="text-sm font-medium text-gray-900 text-right">
                    {new Intl.NumberFormat('en-US').format(r.total_collected_amount_cents || 0)}
                  </td>
                  <td className="text-xs text-gray-500">{fmtDateTime(r.created_at ?? r.createdAt)}</td>
                  <td className="text-xs text-gray-500">{fmtDateTime(r.updated_at ?? r.updatedAt)}</td>
                  <td className="text-center">
                    <Link
                      href={`/workspaces/${r.workspace_uuid}/property-subscriptions`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
