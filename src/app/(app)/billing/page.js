'use client';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import Link from 'next/link';
import BillingService from '@/services/BillingService';
import { Skel, Badge, StatCard } from '@/components/ui';
import { fmtCents } from '@/lib/formatters';
import { BILLING_STATUS_MAP, BILLING_CURRENCIES } from '@/constants/status';

const RuleModal = memo(function RuleModal({ mode, rule, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    range_start: rule?.range_start ?? 1,
    range_end: rule?.range_end ?? '',
    price_cents: rule?.price_cents ?? 0,
    currency: rule?.currency ?? 'TZS',
    effective_from: rule?.effective_from ?? new Date().toISOString().split('T')[0],
    effective_to: rule?.effective_to ?? '',
    sort_order: rule?.sort_order ?? 0,
    status: rule?.status ?? 'active',
  });

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    setSuccess(null);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setSuccess(null);
    const payload = {
      ...form,
      range_end: form.range_end === '' ? null : parseInt(form.range_end, 10),
      price_cents: parseInt(form.price_cents, 10) || 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
      effective_to: form.effective_to === '' ? null : form.effective_to,
    };
    try {
      const res = mode === 'create'
        ? await BillingService.store(payload)
        : await BillingService.update(rule.uuid, payload);
      if (res?.success) {
        setSuccess(mode === 'create' ? 'Billing rule created successfully.' : 'Billing rule updated successfully.');
        setTimeout(() => onSaved(res), 1200);
      } else if (res?.errors) {
        setErrors(res.errors);
      } else if (res?.message) {
        setErrors({ general: [res.message] });
      }
    } catch {
      setErrors({ general: ['Network error. Please try again.'] });
    } finally {
      setSaving(false);
    }
  }, [form, mode, rule, onSaved]);

  const Field = ({ label, name, children, hint, required }) => (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {errors[name]?.map((e, i) => <p key={i} className="text-xs text-red-500 mt-1">{e}</p>)}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{mode === 'create' ? 'Create Billing Rule' : 'Edit Billing Rule'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700">{success}</div>
        )}
        {errors.general?.map((e, i) => (
          <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{e}</div>
        ))}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Range Start" name="range_start" hint="Minimum units" required>
              <input type="number" min={1} value={form.range_start}
                onChange={(e) => update('range_start', parseInt(e.target.value, 10) || 1)} className="input" />
            </Field>
            <Field label="Range End" name="range_end" hint="Leave blank for unlimited">
              <input type="number" min={1} value={form.range_end}
                onChange={(e) => update('range_end', e.target.value)} className="input" placeholder="∞" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (cents)" name="price_cents" required>
              <input type="number" min={0} value={form.price_cents}
                onChange={(e) => update('price_cents', e.target.value)} className="input" />
            </Field>
            <Field label="Currency" name="currency">
              <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input">
                {BILLING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective From" name="effective_from" required>
              <input type="date" value={form.effective_from}
                onChange={(e) => update('effective_from', e.target.value)} className="input" />
            </Field>
            <Field label="Effective To" name="effective_to">
              <input type="date" value={form.effective_to}
                onChange={(e) => update('effective_to', e.target.value)} className="input" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order" name="sort_order" hint="Display order">
              <input type="number" min={0} value={form.sort_order}
                onChange={(e) => update('sort_order', e.target.value)} className="input" />
            </Field>
            <Field label="Status" name="status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
          <div className="pt-2 flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              {saving ? 'Saving…' : (mode === 'create' ? 'Create Rule' : 'Save Changes')}
            </button>
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default function BillingRulesPage() {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, active: 0, inactive: 0 });

  const [filters, setFilters] = useState({ status: '', page: 1 });
  const [modal, setModal] = useState(null); // { mode:'create'|'edit', rule? }

  const fetchRules = useCallback(async (f) => {
    setLoading(true);
    const data = await BillingService.index({
      per_page: 15,
      page: f.page,
      ...(f.status ? { status: f.status } : {}),
    });
    if (data?.data) {
      setRules(data.data);
      setMeta(data.meta);
      if (f.page === 1 && !f.status) {
        setCounts((prev) => ({ ...prev, total: data.meta?.total ?? prev.total }));
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRules(filters); }, [filters, fetchRules]);

  useEffect(() => {
    Promise.allSettled([
      BillingService.index({ per_page: 1, status: 'active' }),
      BillingService.index({ per_page: 1, status: 'inactive' }),
    ]).then(([a, i]) => {
      const g = (r) => r.status === 'fulfilled' ? (r.value?.meta?.total ?? 0) : 0;
      setCounts((prev) => ({ ...prev, active: g(a), inactive: g(i) }));
    });
  }, []);

  const handleStatus = useCallback((e) => {
    setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }));
  }, []);

  const handlePage = useCallback((pg) => {
    setFilters((prev) => ({ ...prev, page: pg }));
  }, []);

  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, filters.page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, filters.page]);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Billing Rules</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage unit-based pricing rules</p>
        </div>
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Create Rule
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth -mx-2 px-2">
        <div className="shrink-0 min-w-[140px] snap-start">
          <StatCard label="Total" value={counts.total}
            icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            color="#0891b2" bg="#ecfeff" />
        </div>
        <div className="shrink-0 min-w-[140px] snap-start">
          <StatCard label="Active" value={counts.active}
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="#16a34a" bg="#f0fdf4" />
        </div>
        <div className="shrink-0 min-w-[140px] snap-start">
          <StatCard label="Inactive" value={counts.inactive}
            icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            color="#dc2626" bg="#fef2f2" />
        </div>
      </div>

      {/* Table */}
      <div className="data-table-wrap">
        <div className="table-toolbar">
          <select value={filters.status} onChange={handleStatus} className="input table-filter-select py-2 text-sm">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Unit Range</th>
              <th>Price</th>
              <th>Currency</th>
              <th>Effective From</th>
              <th>Effective To</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 6 }, (_, i) => (
              <tr key={i}>
                <td><Skel w="w-20" h="h-3" /></td>
                <td><Skel w="w-24" h="h-3" /></td>
                <td><Skel w="w-10" h="h-3" /></td>
                <td><Skel w="w-20" h="h-3" /></td>
                <td><Skel w="w-20" h="h-3" /></td>
                <td><Skel w="w-14" h="h-5" /></td>
                <td className="text-right"><Skel w="w-12" h="h-7" /></td>
              </tr>
            ))}
            {!loading && rules.length === 0 && (
              <tr><td colSpan={7} className="text-center py-14 text-gray-400 text-sm">No billing rules found</td></tr>
            )}
            {!loading && rules.map((r) => (
              <tr key={r.uuid}>
                <td className="text-sm font-medium text-gray-900">
                  {r.unit_range_label || `${r.range_start}${r.range_end ? `–${r.range_end}` : '+'} units`}
                </td>
                <td className="text-sm text-gray-900 font-medium">{r.price_formatted || fmtCents(r.price_cents, r.currency)}</td>
                <td className="text-xs text-gray-500 font-mono">{r.currency}</td>
                <td className="text-xs text-gray-500">{fmtDate(r.effective_from)}</td>
                <td className="text-xs text-gray-500">{fmtDate(r.effective_to) || '—'}</td>
                <td><Badge map={BILLING_STATUS_MAP} value={r.status} /></td>
                <td className="text-right">
                  <button
                    onClick={() => setModal({ mode: 'edit', rule: r })}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors">
                    Edit
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pageNums.length > 0 && (
          <div className="table-pagination">
            <p className="text-xs text-gray-400">Showing {meta.from}–{meta.to} of {meta.total} rules</p>
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

      {modal && (
        <RuleModal
          mode={modal.mode}
          rule={modal.rule}
          onClose={() => setModal(null)}
          onSaved={(res) => {
            setModal(null);
            const exists = rules.some((r) => r.uuid === res?.data?.uuid);
            if (exists && res?.data) {
              setRules((prev) => prev.map((r) => (r.uuid === res.data.uuid ? res.data : r)));
            } else {
              fetchRules(filters);
            }
          }}
        />
      )}
    </div>
  );
}
