'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel, Badge, ConfirmModal } from '@/components/ui';
import { fmt, fmtCents, fmtDate, fmtDateTime } from '@/lib/formatters';
import { ADJUSTMENT_STATUS_MAP, ADJUSTMENT_TYPE_MAP } from '@/constants/status';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Newest' },
  { value: 'created_at', label: 'Oldest' },
  { value: '-effective_at', label: 'Effective (newest)' },
  { value: 'effective_at', label: 'Effective (oldest)' },
  { value: '-prorated_adjustment_cents', label: 'Amount (high)' },
  { value: 'prorated_adjustment_cents', label: 'Amount (low)' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function DeltaBadge({ cents }) {
  if (!cents || cents === 0) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">No change</span>;
  }
  const isCharge = cents > 0;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${isCharge ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
      {isCharge ? '+' : ''}{fmtCents(Math.abs(cents))}
    </span>
  );
}

function InlineStat({ label, value, sub }) {
  return (
    <div>
      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
    </div>
  );
}

function ComparisonRow({ label, baseline, current, unit = '' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-4 text-right">
        <span className="text-xs text-gray-400">{fmt(baseline)}{unit}</span>
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className="text-xs font-semibold text-gray-900">{fmt(current)}{unit}</span>
      </div>
    </div>
  );
}

// ─── Preview Section ─────────────────────────────────────────────────────────
function PreviewSection({ preview, loading }) {
  if (loading) {
    return (
      <div className="card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skel w="w-10" h="h-10" />
          <div className="space-y-1"><Skel w="w-40" h="h-4" /><Skel w="w-24" h="h-3" /></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <Skel key={i} w="w-full" h="h-14" />)}
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-gray-400">No preview data available.</p>
      </div>
    );
  }

  const bp = preview.billing_rule;
  const eligible = preview.eligibility?.is_billable_cycle;
  const hasBillable = preview.eligibility?.has_billable_adjustment;
  const reason = preview.eligibility?.reason;

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: eligible ? (hasBillable ? '#fef2f2' : '#f0fdf4') : '#f8fafc' }}>
            <svg className="w-5 h-5" style={{ color: eligible ? (hasBillable ? '#dc2626' : '#16a34a') : '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Usage Adjustment Preview</p>
            <p className="text-xs text-gray-400">
              {bp ? `${bp.name} · ${bp.billing_interval}` : 'No billing rule'}
              {' · '}
              <span className={eligible ? 'text-green-600 font-semibold' : 'text-amber-600 font-semibold'}>
                {eligible ? (hasBillable ? 'Billable adjustment' : 'No adjustment needed') : 'Not eligible'}
              </span>
            </p>
          </div>
        </div>
        {reason && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-xs text-amber-700">
            {reason}
          </div>
        )}
      </div>

      {/* Period */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {fmtDate(preview.period_starts_at)} → {fmtDate(preview.period_ends_at)}
        </span>
        {preview.effective_at && (
          <span className="inline-flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
            Effective {fmtDateTime(preview.effective_at)}
          </span>
        )}
      </div>

      {/* Baseline vs Current */}
      {preview.baseline && preview.current && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 space-y-1">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Baseline</p>
            <ComparisonRow label="Properties" baseline={preview.baseline.properties_count} current={preview.current.properties_count} />
            <ComparisonRow label="Registered Units" baseline={preview.baseline.registered_units_total} current={preview.current.registered_units_total} />
            <ComparisonRow label="Amount" baseline={fmtCents(preview.baseline.amount_cents)} current={fmtCents(preview.current.amount_cents)} />
          </div>

          <div className="space-y-3">
            {/* Pricing */}
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Pricing</p>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-500">Delta</span>
                <DeltaBadge cents={preview.pricing?.delta_price_cents} />
              </div>
              {preview.proration?.applies && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-gray-500">Prorated</span>
                  <DeltaBadge cents={preview.proration?.prorated_adjustment_cents} />
                </div>
              )}
            </div>

            {/* Proration detail */}
            {preview.proration?.applies && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                <p className="text-xs font-semibold text-amber-800">Proration ({preview.proration.adjustment_type})</p>
                <p className="text-xs text-amber-700 mt-1">
                  {preview.proration.remaining_cycle_days} of {preview.proration.total_cycle_days} days remaining
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending adjustment */}
      {preview.pending_adjustment && (
        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-800 mb-2">Pending Adjustment</p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Badge map={ADJUSTMENT_STATUS_MAP} value={preview.pending_adjustment.status} />
            <Badge map={ADJUSTMENT_TYPE_MAP} value={preview.pending_adjustment.adjustment_type} />
            <span className="text-gray-500">{fmtCents(preview.pending_adjustment.prorated_adjustment_cents)}</span>
            <span className="text-gray-400">Effective {fmtDate(preview.pending_adjustment.effective_at)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Adjustments Table ────────────────────────────────────────────────────────
function AdjustmentsTable({ rows, meta, loading, onPage, onSort, currentSort, onApply, onWaive }) {
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
            <th>Status</th>
            <th>Type</th>
            <th>Period</th>
            <th className="text-right">Baseline</th>
            <th className="text-right">Current</th>
            <th className="text-right">Prorated</th>
            <th>Effective</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({ length: 4 }, (_, i) => (
            <tr key={i}>
              <td><Skel w="w-14" h="h-5" /></td>
              <td><Skel w="w-12" h="h-5" /></td>
              <td><Skel w="w-28" h="h-3" /></td>
              <td className="text-right"><Skel w="w-16" h="h-3" /></td>
              <td className="text-right"><Skel w="w-16" h="h-3" /></td>
              <td className="text-right"><Skel w="w-16" h="h-3" /></td>
              <td><Skel w="w-20" h="h-3" /></td>
              <td className="text-right"><Skel w="w-16" h="h-7" /></td>
            </tr>
          ))}
          {!loading && rows.length === 0 && (
            <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No adjustments found</td></tr>
          )}
          {!loading && rows.map((row) => {
            const isPending = row.status === 'pending';
            const periodLabel = row.period_starts_at && row.period_ends_at
              ? `${fmtDate(row.period_starts_at)} → ${fmtDate(row.period_ends_at)}`
              : '—';
            return (
              <tr key={row.uuid}>
                <td><Badge map={ADJUSTMENT_STATUS_MAP} value={row.status} /></td>
                <td><Badge map={ADJUSTMENT_TYPE_MAP} value={row.adjustment_type} /></td>
                <td className="text-xs text-gray-500">{periodLabel}</td>
                <td className="text-right text-xs text-gray-600">{fmtCents(row.baseline?.amount_cents)}</td>
                <td className="text-right text-xs text-gray-600">{fmtCents(row.current?.amount_cents)}</td>
                <td className="text-right">
                  <DeltaBadge cents={row.pricing?.prorated_adjustment_cents ?? row.prorated_adjustment_cents} />
                </td>
                <td className="text-xs text-gray-500">{fmtDate(row.effective_at)}</td>
                <td className="text-right">
                  {isPending && (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onApply(row)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"
                        title="Apply"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => onWaive(row)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                        title="Waive"
                      >
                        Waive
                      </button>
                    </div>
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
export default function UsageAdjustmentsPage() {
  const { uuid } = useParams();

  // Preview state
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);

  // Table state
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [tableLoading, setTableLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', adjustment_type: '', sort: '-created_at', page: 1 });

  // Confirm modal state (3-state pattern)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: null, mode: 'apply' });
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  // Load preview
  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    const res = await WorkspaceService.usageAdjustmentPreview(uuid);
    if (res?.success) {
      setPreview(res.data);
    }
    setPreviewLoading(false);
  }, [uuid]);

  // Load table
  const loadTable = useCallback(async (f) => {
    setTableLoading(true);
    const res = await WorkspaceService.usageAdjustments(uuid, {
      per_page: 10,
      page: f.page,
      sort: f.sort,
      ...(f.status ? { status: f.status } : {}),
      ...(f.adjustment_type ? { adjustment_type: f.adjustment_type } : {}),
    });
    if (res?.success) {
      setRows(res.data ?? []);
      setMeta(res.meta ?? null);
    }
    setTableLoading(false);
  }, [uuid]);

  // Initial load
  useEffect(() => {
    loadPreview();
    loadTable(filters);
  }, [loadPreview, loadTable, filters]);

  // Handlers
  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const handleSort = useCallback((e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, sort: val, page: 1 }));
  }, []);

  const handleStatus = useCallback((e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, status: val, page: 1 }));
  }, []);

  const handleType = useCallback((e) => {
    const val = e.target.value;
    setFilters((prev) => ({ ...prev, adjustment_type: val, page: 1 }));
  }, []);

  // Confirm modal helpers
  const promptAction = useCallback((title, message, actionFn, mode) => {
    setConfirmConfig({ title, message, action: actionFn, mode });
    setConfirmResult(null);
    setConfirmLoading(false);
    setConfirmOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!confirmConfig.action) return;
    setConfirmLoading(true);
    setConfirmResult(null);
    try {
      const res = await confirmConfig.action();
      if (res?.success) {
        setConfirmResult({ type: 'success', message: 'Action completed successfully.' });
        loadPreview();
        loadTable(filters);
      } else {
        setConfirmResult({ type: 'error', message: res?.message || 'Action failed. Please try again.' });
      }
    } catch {
      setConfirmResult({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmConfig.action, filters, loadPreview, loadTable]);

  const handleCloseConfirm = useCallback(() => {
    setConfirmOpen(false);
    setConfirmResult(null);
  }, []);

  const onApply = useCallback((row) => {
    promptAction(
      'Apply Adjustment',
      `Apply this usage adjustment (${fmtCents(row.pricing?.prorated_adjustment_cents ?? row.prorated_adjustment_cents)})? This will charge or credit the workspace and advance the billing baseline.`,
      () => WorkspaceService.applyUsageAdjustment(uuid, row.uuid, { showLoader: false }),
      'apply'
    );
  }, [uuid, promptAction]);

  const onWaive = useCallback((row) => {
    promptAction(
      'Waive Adjustment',
      `Waive this usage adjustment (${fmtCents(row.pricing?.prorated_adjustment_cents ?? row.prorated_adjustment_cents)})? The workspace will not be charged or credited, but the baseline will still be advanced.`,
      () => WorkspaceService.waiveUsageAdjustment(uuid, row.uuid, { showLoader: false }),
      'waive'
    );
  }, [uuid, promptAction]);

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
      <div>
        <h1 className="text-xl font-bold text-gray-900">Usage Adjustments</h1>
        <p className="text-sm text-gray-400 mt-0.5">Preview, manage and apply usage-based billing adjustments</p>
      </div>

      {/* Preview */}
      <PreviewSection preview={preview} loading={previewLoading} />

      {/* Table */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-xs text-gray-400">{meta ? `${fmt(meta.total)} adjustments` : 'Loading…'}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={filters.status} onChange={handleStatus} className="input py-1.5 text-xs w-32">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="applied">Applied</option>
              <option value="waived">Waived</option>
              <option value="superseded">Superseded</option>
            </select>
            <select value={filters.adjustment_type} onChange={handleType} className="input py-1.5 text-xs w-32">
              <option value="">All Types</option>
              <option value="charge">Charge</option>
              <option value="credit">Credit</option>
              <option value="none">None</option>
            </select>
            <select value={filters.sort} onChange={handleSort} className="input py-1.5 text-xs w-40">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <AdjustmentsTable
          rows={rows}
          meta={meta}
          loading={tableLoading}
          onPage={handlePage}
          onSort={handleSort}
          currentSort={filters.sort}
          onApply={onApply}
          onWaive={onWaive}
        />
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmOpen}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirm}
        onRetry={handleConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmLabel={confirmConfig.mode === 'apply' ? 'Apply' : 'Waive'}
        danger={confirmConfig.mode === 'waive'}
        loading={confirmLoading}
        result={confirmResult}
      />
    </div>
  );
}
