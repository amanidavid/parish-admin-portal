// ─── Workspace Detail — Tabbed View ──────────────────────────────────────────
'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel, Badge, OccBar, ConfirmModal } from '@/components/ui';
import { fmt, fmtAmt, pct, fmtDate, fmtCents } from '@/lib/formatters';
import { WORKSPACE_STATUS_MAP, PROV_MAP, ACCESS_CFG, CT_COLORS, SUB_STATUS_MAP } from '@/constants/status';
import useUiStore from '@/store/uiStore';

const TAB_DEFS = [
  { key: 'operational', label: 'Operational View', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'contracts', label: 'Contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { key: 'properties', label: 'Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'location', label: 'Location', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
  { key: 'subscription', label: 'Subscription', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

// ─── Tab Skeleton ─────────────────────────────────────────────────────────────
function TabSkeleton() {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="card p-5 space-y-3">
            <Skel w="w-24" h="h-3" /><Skel w="w-16" h="h-7" />
            <div className="pt-3 border-t border-gray-50 space-y-1.5">
              <Skel h="h-3" /><Skel h="h-3" /><Skel w="w-3/4" h="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Operational View ────────────────────────────────────────────────────
function OperationalTab({ data }) {
  const op = data.operational;
  const ws = data.workspace;
  const acc = useMemo(() => ws?.access_state ? (ACCESS_CFG[ws.access_state] ?? null) : null, [ws]);
  const cards = useMemo(() => [
    { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: '#ea580c', bg: '#fff7ed', title: 'Properties', main: fmt(op?.properties?.total), sub: `${fmt(op?.floors?.total)} floors`, rows: [{ label: 'Active', value: fmt(op?.properties?.active), clr: '#16a34a' }, { label: 'Inactive', value: fmt(op?.properties?.inactive), clr: '#9ca3af' }] },
    { icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', color: '#0891b2', bg: '#ecfeff', title: 'Units', main: fmt(op?.units?.total), sub: `${pct(op?.units?.occupied, op?.units?.total)}% occupied`, occBar: { occupied: op?.units?.occupied ?? 0, total: op?.units?.total ?? 0 }, rows: [{ label: 'Occupied', value: fmt(op?.units?.occupied), clr: '#16a34a' }, { label: 'Vacant', value: fmt(op?.units?.vacant), clr: '#d97706' }, { label: 'Maintenance', value: fmt(op?.units?.maintenance), clr: '#dc2626' }] },
    { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', color: '#7c3aed', bg: '#f5f3ff', title: 'Customers', main: fmt(op?.customers?.total), sub: null, rows: [{ label: 'Active', value: fmt(op?.customers?.active), clr: '#16a34a' }, { label: 'Inactive', value: fmt(op?.customers?.inactive), clr: '#9ca3af' }] },
    { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: '#0284c7', bg: '#f0f9ff', title: 'Contracts', main: fmt(op?.contracts?.total), sub: null, rows: [{ label: 'Active', value: fmt(op?.contracts?.active), clr: '#16a34a' }, { label: 'Draft', value: fmt(op?.contracts?.draft), clr: '#6b7280' }, { label: 'Expired', value: fmt(op?.contracts?.expired), clr: '#dc2626' }] },
    { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: '#16a34a', bg: '#f0fdf4', title: 'Revenue', main: fmtAmt(op?.contracts?.active_contract_amount), sub: 'active contract value', rows: [{ label: 'Total contracted', value: fmtAmt(op?.contracts?.total_contract_amount) }] },
    { icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: '#6366f1', bg: '#eef2ff', title: 'Staff', main: fmt(op?.staff?.total), sub: null, rows: [{ label: 'Active', value: fmt(op?.staff?.active), clr: '#16a34a' }, { label: 'Inactive', value: fmt(op?.staff?.inactive), clr: '#9ca3af' }] },
  ], [op]);
  return (
    <div className="space-y-5">
      {acc && (
        <div className="rounded-xl border px-4 py-3 flex items-start gap-3" style={{ backgroundColor: acc.bg, borderColor: acc.border }}>
          <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: acc.dot }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: acc.text }}>{acc.label} Access</p>
            {ws?.access_message && <p className="text-xs mt-0.5" style={{ color: acc.text, opacity: 0.8 }}>{ws.access_message}</p>}
          </div>
          {ws?.subscription && (
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-gray-700">{ws.subscription.plan_name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{ws.subscription.billing_interval} billing</p>
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(({ icon, color, bg, title, main, sub, rows, occBar }) => (
          <div key={title} className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
              </div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 leading-none">{main}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
              {occBar && <OccBar occupied={occBar.occupied} total={occBar.total} />}
            </div>
            {rows?.length > 0 && (
              <div className="pt-3 border-t border-gray-50 space-y-1.5">
                {rows.map(({ label, value, clr }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{label}</span>
                    <span className="text-xs font-semibold" style={{ color: clr ?? '#374151' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Contracts ───────────────────────────────────────────────────────────
function ContractsTab({ data }) {
  const ct = data.totals;
  const ctBy = data.by_status ?? [];
  const total = ct?.contracts_count ?? 1;
  const tiles = useMemo(() => [
    { label: 'Total', value: fmt(ct?.contracts_count), sub: fmtAmt(ct?.total_contract_amount), clr: '#374151' },
    { label: 'Active', value: fmt(ct?.active_contracts_count), sub: fmtAmt(ct?.active_contract_amount), clr: '#16a34a' },
    { label: 'Draft', value: fmt(ct?.draft_contracts_count), sub: null, clr: '#6b7280' },
    { label: 'Expired', value: fmt(ct?.expired_contracts_count), sub: null, clr: '#dc2626' },
    { label: 'Terminated', value: fmt(ct?.terminated_contracts_count), sub: null, clr: '#b91c1c' },
  ], [ct]);
  return (
    <div className="space-y-5">
      {ct?.expiring_soon_count > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-amber-700 font-medium">
            <span className="font-bold">{fmt(ct.expiring_soon_count)}</span> contract{ct.expiring_soon_count !== 1 ? 's' : ''} expiring in the next 30 days
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {tiles.map(({ label, value, sub, clr }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold leading-none" style={{ color: clr }}>{value}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-1">{label}</p>
            {sub && <p className="text-[10px] text-gray-300 mt-0.5 truncate">{sub}</p>}
          </div>
        ))}
      </div>
      {ctBy.length > 0 && (
        <div className="card p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Status Breakdown</p>
          {ctBy.map((row) => {
            const w = pct(row.contracts_count, total);
            return (
              <div key={row.status} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 capitalize w-20 shrink-0">{row.status}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full" style={{ width: `${w}%`, backgroundColor: CT_COLORS[row.status] ?? '#9ca3af' }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-6 text-right shrink-0">{row.contracts_count}</span>
                <span className="text-xs text-gray-400 w-28 text-right shrink-0 hidden sm:block">{fmtAmt(row.total_contract_amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Properties (self-contained) ────────────────────────────────────────
function PropertiesTab({ uuid }) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [page, setPage] = useState(1);
  const debRef = useRef(null);
  const initRef = useRef(false);

  const loadProps = useCallback(async (q, st, pg) => {
    setLoading(true);
    const res = await WorkspaceService.properties(uuid, {
      per_page: 10,
      page: pg,
      ...(q ? { search: q } : {}),
      ...(st ? { status: st } : {}),
    });
    setRows(res?.data?.data ?? res?.data ?? []);
    setMeta(res?.data?.meta ?? res?.meta ?? null);
    setLoading(false);
  }, [uuid]);

  useEffect(() => {
    if (!initRef.current) { initRef.current = true; loadProps('', '', 1); }
  }, [loadProps]);

  const handleSearch = useCallback((e) => {
    const val = e.target.value; setSearch(val);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setPage(1); loadProps(val, statusF, 1); }, 350);
  }, [statusF, loadProps]);
  const handleStatus = useCallback((e) => {
    const val = e.target.value; setStatusF(val); setPage(1); loadProps(search, val, 1);
  }, [search, loadProps]);
  const handlePage = useCallback((pg) => { setPage(pg); loadProps(search, statusF, pg); }, [search, statusF, loadProps]);
  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, page]);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <p className="text-xs text-gray-400">{meta ? `${fmt(meta.total)} properties` : 'Loading…'}</p>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input type="text" placeholder="Search…" value={search} onChange={handleSearch} className="input pl-8 py-1.5 text-xs w-44" />
          </div>
          <select value={statusF} onChange={handleStatus} className="input py-1.5 text-xs w-32">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead><tr><th>Property</th><th>Location</th><th className="text-center">Floors</th><th>Units</th><th className="text-center">Contracts</th><th>Created</th><th>Status</th></tr></thead>
          <tbody>
            {loading && Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
                <td><Skel w="w-32" h="h-3.5" /></td><td><Skel w="w-24" h="h-3" /></td>
                <td><Skel w="w-8" h="h-3" /></td><td><Skel w="w-28" h="h-3" /></td>
                <td><Skel w="w-10" h="h-3" /></td><td><Skel w="w-16" h="h-3" /></td><td><Skel w="w-14" h="h-5" /></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">No properties found</td></tr>
            )}
            {!loading && rows.map((p) => {
              const loc = [p.district_name, p.region_name, p.country_name].filter(Boolean).join(', ');
              return (
                <tr key={p.property_uuid ?? p.uuid}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="text-orange-700 text-[10px] font-bold">{(p.name || 'P').charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-gray-900 text-sm">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-xs text-gray-500 max-w-[160px] truncate">{loc || '—'}</td>
                  <td className="text-center text-sm font-medium text-gray-700">{fmt(p.floors_count)}</td>
                  <td>
                    <div className="min-w-[100px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-900 font-medium">{fmt(p.occupied_units)}/{fmt(p.units_count)}</span>
                        <span className="text-gray-400">{p.vacant_units} vacant</span>
                      </div>
                      <OccBar occupied={p.occupied_units} total={p.units_count} />
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{fmt(p.active_contracts_count)}</div>
                    <div className="text-[10px] text-gray-400">{fmt(p.contracts_count)} total</div>
                  </td>
                  <td className="text-xs text-gray-500">{fmtDate(p.created_at ?? p.createdAt)}</td>
                  <td><Badge map={WORKSPACE_STATUS_MAP} value={p.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pageNums.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400">Showing {meta.from}–{meta.to} of {fmt(meta.total)}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => handlePage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {pageNums.map((pg) => (
                <button key={pg} onClick={() => handlePage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-primary-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{pg}</button>
              ))}
              <button onClick={() => handlePage(Math.min(meta.last_page, page + 1))} disabled={page === meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Location ────────────────────────────────────────────────────────────
function LocationTab({ data }) {
  const totals = data.summary?.totals ?? {};
  const countries = data.summary?.countries ?? [];
  const regions = data.summary?.regions ?? [];
  const maxProps = useMemo(() => countries.reduce((m, c) => Math.max(m, c.properties_count), 1), [countries]);
  const chips = useMemo(() => [
    { label: 'Countries', value: totals.registered_countries_count ?? 0, icon: '🌍' },
    { label: 'Regions', value: totals.registered_regions_count ?? 0, icon: '📍' },
    { label: 'Districts', value: totals.registered_districts_count ?? 0, icon: '🏙️' },
    { label: 'Wards', value: totals.registered_wards_count ?? 0, icon: '🏘️' },
  ], [totals]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {chips.map(({ label, value, icon }) => (
          <div key={label} className="card p-4 text-center">
            <p className="text-xl mb-1">{icon}</p>
            <p className="text-xl font-bold text-gray-900">{fmt(value)}</p>
            <p className="text-[11px] text-gray-400 font-medium">{label}</p>
          </div>
        ))}
      </div>
      {countries.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Properties by Country
            <span className="ml-2 text-xs font-normal text-gray-400">({fmt(totals.properties_count)} total)</span>
          </h3>
          <div className="space-y-2.5">
            {countries.map((c) => (
              <div key={c.country_uuid ?? c.country_name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-32 shrink-0 truncate font-medium">{c.country_name}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary-500" style={{ width: `${pct(c.properties_count, maxProps)}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{fmt(c.properties_count)}</span>
              </div>
            ))}
          </div>
          {regions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 font-medium mb-2">Top Regions</p>
              <div className="flex flex-wrap gap-2">
                {regions.slice(0, 10).map((r) => (
                  <div key={r.region_uuid ?? r.region_name}
                    className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
                    <span className="text-xs text-gray-600 font-medium">{r.region_name}</span>
                    <span className="text-[10px] text-gray-400">{r.properties_count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Subscription ────────────────────────────────────────────────────────
function SubscriptionTab({ data, uuid }) {
  const sub = data.subscription;
  const usage = data.usage;
  const plan = sub?.plan;
  const bp = sub?.billing_profile;
  const pending = sub?.pending_billing_profile_change;

  return (
    <div className="space-y-5">
      {/* Plan card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Subscription</span></div>
            <div className="info-card-body">
              {plan && (
                <>
                  <div className="info-card-row"><span className="info-card-label">Plan</span><span className="info-card-value">{plan.name}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Interval</span><span className="info-card-value capitalize">{plan.billing_interval}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Base Price</span><span className="info-card-value">{fmtCents(plan.price_cents, plan.currency || bp?.currency)}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Price / Property</span><span className="info-card-value">{fmtCents(plan.price_per_property_cents, plan.currency || bp?.currency)}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Properties Included</span><span className="info-card-value">{plan.properties_included}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Trial Days</span><span className="info-card-value">{plan.trial_days}</span></div>
                </>
              )}
              <div className="info-card-row"><span className="info-card-label">Status</span><span className="info-card-value"><Badge map={SUB_STATUS_MAP} value={sub?.status} /></span></div>
              <div className="info-card-row"><span className="info-card-label">Effective Status</span><span className="info-card-value capitalize">{sub?.effective_status}</span></div>
              <div className="info-card-row"><span className="info-card-label">Current Period</span><span className="info-card-value">{fmtDate(sub?.current_period_starts_at)} → {fmtDate(sub?.current_period_ends_at)}</span></div>
              <div className="info-card-row"><span className="info-card-label">Trial Ends</span><span className="info-card-value">{fmtDate(sub?.trial_ends_at)}</span></div>
              <div className="info-card-row"><span className="info-card-label">Subscription Ends</span><span className="info-card-value">{fmtDate(sub?.ends_at)}</span></div>
            </div>
          </div>

          {pending && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">Pending Billing Profile Change</p>
              <p className="text-xs text-amber-700 mt-1">
                From <strong>{pending.old_billing_profile?.name}</strong> to <strong>{pending.new_billing_profile?.name}</strong>
                {' · '}Effective {fmtDate(pending.effective_at)}
                {' · '}Change: {fmtCents(pending.new_price_cents - pending.current_price_cents, pending.old_billing_profile?.currency)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Actions</span></div>
            <div className="p-3 space-y-2">
              <Link href={`/workspaces/${uuid}/billing`}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Change Billing Profile
              </Link>
              <Link href={`/workspaces/${uuid}/usage-adjustments`}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Usage Adjustments
              </Link>
              <Link href={`/workspaces/${uuid}/property-subscriptions`}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.666V3m-6 3.666V3m0 7.334V21m6-10.666V21m0-3.666a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Property Subscriptions
              </Link>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Usage</span></div>
            <div className="info-card-body">
              <div className="info-card-row"><span className="info-card-label">Properties</span><span className="info-card-value text-lg font-black">{fmt(usage?.registered_properties)}</span></div>
              <div className="info-card-row"><span className="info-card-label">Units</span><span className="info-card-value text-lg font-black">{fmt(usage?.registered_units_total)}</span></div>
              <div className="info-card-row"><span className="info-card-label">Estimated Total</span><span className="info-card-value text-lg font-black text-primary-600">{fmtCents(usage?.estimated_total_price_cents, bp?.currency)}</span></div>
            </div>
          </div>

          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Billing Profile</span></div>
            <div className="info-card-body">
              {bp ? (
                <>
                  <div className="info-card-row"><span className="info-card-label">Name</span><span className="info-card-value">{bp.name}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Interval</span><span className="info-card-value capitalize">{bp.billing_interval}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Currency</span><span className="info-card-value font-mono">{bp.currency}</span></div>
                  <div className="info-card-row"><span className="info-card-label">Trial / Grace</span><span className="info-card-value">{bp.trial_days}d / {bp.grace_days}d</span></div>
                </>
              ) : (
                <p className="text-sm text-gray-400 py-2">No billing profile assigned</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Actions ───────────────────────────────────────────────────────
function WorkspaceActions({ uuid, workspace, onRefresh }) {
  const [acting, setActing] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: null, danger: false });
  const [confirmResult, setConfirmResult] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    function handle(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const promptAction = (title, message, fn, danger = false) => {
    setConfirmConfig({ title, message, action: fn, danger });
    setConfirmResult(null);
    setConfirmOpen(true);
    setOpen(false);
  };

  const handleConfirm = async () => {
    if (!confirmConfig.action) return;
    setActing(true);
    setConfirmResult(null);
    try {
      const res = await confirmConfig.action();
      if (res?.success) {
        setConfirmResult({ type: 'success', message: 'Action completed successfully.' });
      } else {
        setConfirmResult({ type: 'error', message: res?.message || 'Action failed. Please try again.' });
      }
    } catch {
      setConfirmResult({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setActing(false);
    }
  };

  const handleClose = () => {
    setConfirmOpen(false);
    setConfirmResult(null);
    // Refresh parent workspace state when modal closes after a result
    if (confirmResult?.type === 'success' && onRefresh) {
      onRefresh();
    }
  };

  const isProvFailed = workspace?.provisioning_status === 'failed';
  const isActive = workspace?.status === 'active';

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={acting}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Actions
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-lg z-20 py-1">
            {isProvFailed && (
              <button onClick={() => promptAction('Retry Provisioning', 'Retry provisioning for this workspace?', () => WorkspaceService.retryProvisioning(uuid, { showLoader: false }))}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                Retry Provisioning
              </button>
            )}
            <button onClick={() => promptAction(
              isActive ? 'Suspend Workspace' : 'Reactivate Workspace',
              isActive ? 'Suspend this workspace?' : 'Reactivate this workspace?',
              () => WorkspaceService.updateStatus(uuid, { status: isActive ? 'suspended' : 'active' }, { showLoader: false })
            )}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              {isActive ? 'Suspend Workspace' : 'Reactivate Workspace'}
            </button>
            <button onClick={() => promptAction('Set Subscription Active', 'Activate subscription for this workspace?', () => WorkspaceService.updateSubscriptionStatus(uuid, { status: 'active' }, { showLoader: false }))}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              Set Subscription Active
            </button>
            <button onClick={() => promptAction('Cancel Subscription', 'Cancel subscription for this workspace?', () => WorkspaceService.updateSubscriptionStatus(uuid, { status: 'canceled' }, { showLoader: false }), true)}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              Cancel Subscription
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={confirmOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        onRetry={handleConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.danger ? 'Cancel Subscription' : 'Confirm'}
        danger={confirmConfig.danger}
        loading={acting}
        result={confirmResult}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkspaceDetailPage() {
  const { uuid } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('operational');
  const [tabData, setTabData] = useState({ operational: null, contracts: null, location: null, subscription: null });
  const [tabStatus, setTabStatus] = useState({ operational: 'loading', contracts: 'idle', properties: 'idle', location: 'idle', subscription: 'idle' });
  const fetchedRef = useRef(new Set(['operational']));

  const loadOperational = useCallback(async () => {
    const res = await WorkspaceService.operationalSummary(uuid);
    const d = res?.data ?? null;
    setTabData((prev) => ({ ...prev, operational: d }));
    setWorkspace(d?.workspace ?? null);
    setTabStatus((prev) => ({ ...prev, operational: d ? 'loaded' : 'empty' }));
    setPageLoading(false);
  }, [uuid]);

  useEffect(() => { loadOperational(); }, [loadOperational]);

  const fetchTabData = useCallback(async (key) => {
    if (fetchedRef.current.has(key)) return;
    fetchedRef.current.add(key);
    setTabStatus((prev) => ({ ...prev, [key]: 'loading' }));
    try {
      if (key === 'contracts') {
        const res = await WorkspaceService.contractsSummary(uuid);
        const d = res?.data ?? null;
        setTabData((prev) => ({ ...prev, contracts: d }));
        setTabStatus((prev) => ({ ...prev, contracts: d ? 'loaded' : 'empty' }));
      } else if (key === 'location') {
        const res = await WorkspaceService.propertyLocationSummary(uuid);
        const sum = res?.data ?? null;
        const d = sum ? { summary: sum } : null;
        setTabData((prev) => ({ ...prev, location: d }));
        setTabStatus((prev) => ({ ...prev, location: d ? 'loaded' : 'empty' }));
      } else if (key === 'properties') {
        setTabStatus((prev) => ({ ...prev, properties: 'loaded' }));
      } else if (key === 'subscription') {
        const res = await WorkspaceService.subscription(uuid);
        const d = res?.data ?? null;
        setTabData((prev) => ({ ...prev, subscription: d }));
        setTabStatus((prev) => ({ ...prev, subscription: d ? 'loaded' : 'empty' }));
      }
    } catch {
      setTabStatus((prev) => ({ ...prev, [key]: 'empty' }));
    }
  }, [uuid]);

  const handleTabSelect = useCallback((key) => {
    setActiveTab(key);
    if (!fetchedRef.current.has(key)) fetchTabData(key);
  }, [fetchTabData]);

  const availableTabs = useMemo(
    () => TAB_DEFS.filter((t) => tabStatus[t.key] !== 'empty'),
    [tabStatus]
  );

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find((t) => t.key === activeTab)) {
      setActiveTab(availableTabs[0].key);
    }
  }, [availableTabs, activeTab]);

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2"><Skel w="w-48" h="h-5" /><Skel w="w-32" h="h-3.5" /></div>
          </div>
        </div>
        <TabSkeleton />
      </div>
    );
  }

  const acc = workspace?.access_state ? (ACCESS_CFG[workspace.access_state] ?? null) : null;

  return (
    <div className="space-y-6">
      <Link href="/workspaces"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workspaces
      </Link>

      {/* Workspace header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white text-lg font-bold"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              {(workspace?.display_name || workspace?.name || 'W').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{workspace?.display_name || workspace?.name || '—'}</h1>
              <p className="text-sm text-gray-400 font-mono mt-0.5">{workspace?.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge map={WORKSPACE_STATUS_MAP} value={workspace?.status} />
                <Badge map={PROV_MAP} value={workspace?.provisioning_status} />
                {workspace?.subscription?.plan_name && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                    {workspace.subscription.plan_name}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">Created {fmtDate(workspace?.created_at ?? workspace?.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {acc && (
              <div className="rounded-xl border px-4 py-2.5 flex items-center gap-2"
                style={{ backgroundColor: acc.bg, borderColor: acc.border }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.dot }} />
                <span className="text-sm font-semibold capitalize" style={{ color: acc.text }}>
                  {workspace?.access_state?.replace('_', ' ')}
                </span>
              </div>
            )}
            <WorkspaceActions uuid={uuid} workspace={workspace} onRefresh={loadOperational} />
          </div>
        </div>
      </div>

      {/* Tab nav — scrollable with snap */}
      <div className="border-b border-gray-200 relative">
        {/* Fade indicator on the right when scrollable */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />

        <nav
          className="flex overflow-x-auto scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabSelect(tab.key)}
              className={`group flex items-center justify-center gap-2 min-w-[80px] sm:min-w-0 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key
                ? 'border-primary-600 text-primary-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{ scrollSnapAlign: 'start' }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
              {tabStatus[tab.key] === 'loading' && (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 border-t-primary-600 animate-spin shrink-0" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-1">
        {activeTab === 'operational' && (tabStatus.operational === 'loading' ? <TabSkeleton /> : tabData.operational ? <OperationalTab data={tabData.operational} /> : null)}
        {activeTab === 'contracts' && (tabStatus.contracts === 'loading' ? <TabSkeleton /> : tabData.contracts ? <ContractsTab data={tabData.contracts} /> : null)}
        {activeTab === 'properties' && <PropertiesTab uuid={uuid} />}
        {activeTab === 'location' && (tabStatus.location === 'loading' ? <TabSkeleton /> : tabData.location ? <LocationTab data={tabData.location} /> : null)}
        {activeTab === 'subscription' && (tabStatus.subscription === 'loading' ? <TabSkeleton /> : tabData.subscription ? <SubscriptionTab data={tabData.subscription} uuid={uuid} /> : null)}
      </div>
    </div>
  );
}
