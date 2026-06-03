'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import useAdminAuthStore from '@/store/adminAuthStore';
import PlatformService from '@/services/PlatformService';
import { Skel, Badge } from '@/components/ui';
import { fmt } from '@/lib/formatters';
import { WORKSPACE_STATUS_MAP, PROV_MAP } from '@/constants/status';

// ─── Module-level cache ── persists across client navigations, TTL 30 s ──────
const _cache = { data: null, ts: 0 };
const CACHE_TTL = 30_000;

// Decorative bar patterns — one per card category (static visual)
const BARS = {
  total: [3, 5, 4, 6, 5, 8, 7, 9, 8, 10],
  active: [4, 6, 5, 7, 8, 7, 9, 8, 10, 9],
  suspended: [8, 6, 7, 5, 6, 4, 5, 3, 4, 3],
  failed: [5, 4, 6, 4, 5, 4, 3, 5, 3, 2],
  billing: [3, 5, 5, 6, 6, 7, 7, 8, 8, 9],
  billingActive: [4, 6, 6, 8, 7, 9, 8, 9, 10, 9],
};

// ─── Platform Stat Card ───────────────────────────────────────────────────────
function StatCard({ id, label, value, icon, color, bg, loading, href }) {
  const bars = BARS[id] ?? BARS.total;
  const inner = (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between min-h-[116px] overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Top row: icon + mini bar chart */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
        {/* Decorative bars */}
        <div className="flex items-end gap-[2px] h-8 opacity-25 group-hover:opacity-50 transition-opacity shrink-0">
          {bars.map((h, i) => (
            <div key={i} className="w-[5px] rounded-t-[2px]" style={{ height: `${h * 9}%`, backgroundColor: color }} />
          ))}
        </div>
      </div>
      {/* Bottom row: number + label */}
      <div className="mt-3">
        {loading
          ? <Skel w="w-14" h="h-7" />
          : <p className="text-[26px] font-black text-gray-900 leading-none tabular-nums">{fmt(value)}</p>}
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5 truncate">{label}</p>
      </div>
      {/* Bottom color accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl opacity-60" style={{ backgroundColor: color }} />
    </div>
  );
  return href
    ? <Link href={href} className="block">{inner}</Link>
    : inner;
}

export default function DashboardPage() {
  const user = useAdminAuthStore((s) => s.user);

  // ── seed from cache immediately — zero flicker on back-navigation ────────
  const cached = _cache.ts && (Date.now() - _cache.ts < CACHE_TTL) ? _cache.data : null;
  const [stats, setStats] = useState(
    cached?.stats ?? { total: 0, active: 0, suspended: 0, failed: 0, billing: 0, billingActive: 0 }
  );
  const [workspaces, setWorkspaces] = useState(cached?.workspaces ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    if (cached) return; // cache is fresh — nothing to fetch
    PlatformService.overview().then((res) => {
      if (res?.success) {
        const d = res.data;
        const newStats = {
          total: d.summary?.total_workspaces ?? 0,
          active: d.summary?.active_workspaces ?? 0,
          suspended: d.summary?.suspended_workspaces ?? 0,
          failed: d.summary?.provisioning_failed_workspaces ?? 0,
          billing: d.summary?.total_billing_profiles ?? 0,
          billingActive: d.summary?.active_billing_profiles ?? 0,
        };
        const newWorkspaces = d.recent_workspaces ?? [];
        _cache.data = { stats: newStats, workspaces: newWorkspaces };
        _cache.ts = Date.now();
        setStats(newStats);
        setWorkspaces(newWorkspaces);
      }
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = useMemo(
    () => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    []
  );

  return (
    <div className="space-y-7">
      {/* ── Welcome Banner ── */}
      <div className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#ea580c 0%,#f97316 60%,#fb923c 100%)' }}>
        <div className="absolute right-0 top-0 w-64 h-64 opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#fff 0%,transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div>
          <p className="text-orange-100 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0] || user?.username || 'Admin'}
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            {loading ? '…' : fmt(stats.total)} workspaces · {loading ? '…' : fmt(stats.active)} active
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Link href="/workspaces"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm">
            Workspaces
          </Link>
          <Link href="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors">
            Billing
          </Link>
        </div>
      </div>

      {/* ── Platform Stats ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Platform Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard id="total" label="Total Workspaces" value={stats.total} loading={loading} href="/workspaces"
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
            color="#ea580c" bg="#fff7ed" />
          <StatCard id="active" label="Active" value={stats.active} loading={loading} href="/workspaces?status=active"
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="#16a34a" bg="#f0fdf4" />
          <StatCard id="suspended" label="Suspended" value={stats.suspended} loading={loading} href="/workspaces?status=suspended"
            icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            color="#dc2626" bg="#fef2f2" />
          <StatCard id="failed" label="Prov. Failed" value={stats.failed} loading={loading} href="/workspaces?provisioning_status=failed"
            icon="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            color="#d97706" bg="#fffbeb" />
          <StatCard id="billing" label="Billing Profiles" value={stats.billing} loading={loading} href="/billing"
            icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            color="#0891b2" bg="#ecfeff" />
          <StatCard id="billingActive" label="Active Profiles" value={stats.billingActive} loading={loading} href="/billing?status=active"
            icon="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            color="#7c3aed" bg="#f5f3ff" />
        </div>
      </div>

      {/* ── Recent Workspaces Table ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Workspaces</h2>
            <p className="text-xs text-gray-400 mt-0.5">10 most recently registered accounts</p>
          </div>
          <Link href="/workspaces"
            className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Status</th>
                <th>Provisioning</th>
                <th>Database</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <Skel w="w-32" h="h-3" />
                        <Skel w="w-20" h="h-2.5" />
                      </div>
                    </div>
                  </td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-20" h="h-5" /></td>
                  <td><Skel w="w-28" h="h-3" /></td>
                  <td></td>
                </tr>
              ))}
              {!loading && workspaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No workspaces yet</td>
                </tr>
              )}
              {!loading && workspaces.map((t) => (
                <tr key={t.uuid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                        {(t.display_name || t.name || 'W').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.display_name || t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge map={WORKSPACE_STATUS_MAP} value={t.status} />
                  </td>
                  <td>
                    <Badge map={PROV_MAP} value={t.provisioning_status} />
                  </td>
                  <td className="text-xs text-gray-400 font-mono">{t.database || '—'}</td>
                  <td>
                    <Link href={`/workspaces/${t.uuid}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap">
                      View →
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
