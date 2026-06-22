'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BillingService from '@/services/BillingService';
import useUiStore from '@/store/uiStore';
import { Skel, Badge, InfoRow, ConfirmModal } from '@/components/ui';
import { BILLING_STATUS_MAP, RULE_STATUS_MAP } from '@/constants/status';

function OverviewTab({ profile }) {
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="info-card">
          <div className="info-card-header"><span className="info-card-title">Profile Overview</span></div>
          <div className="info-card-body">
            <InfoRow label="Name" value={profile.name} />
            <InfoRow label="Description" value={profile.description || '—'} />
            <InfoRow label="Billing Interval" value={profile.billing_interval} />
            <InfoRow label="Currency" value={profile.currency} mono />
            <InfoRow label="Trial Days" value={profile.trial_days} />
            <InfoRow label="Grace Days" value={profile.grace_days} />
            <InfoRow label="Default" value={profile.is_default ? 'Yes' : 'No'} />
            <InfoRow label="Status" value={<Badge map={BILLING_STATUS_MAP} value={profile.status} />} />
            <InfoRow label="Created" value={fmtDate(profile.created_at)} />
            <InfoRow label="Updated" value={fmtDate(profile.updated_at)} />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="info-card">
          <div className="info-card-header"><span className="info-card-title">Rules Summary</span></div>
          <div className="info-card-body">
            <div className="info-card-row">
              <span className="info-card-label">Total Rules</span>
              <span className="info-card-value text-2xl font-black">{profile.rules_count ?? 0}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-card-header"><span className="info-card-title">Actions</span></div>
          <div className="p-3 space-y-2">
            <Link href={`/billing/${profile.uuid}/edit`}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesTab({ uuid, profile }) {
  const [rules, setRules] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { mode:'create'|'edit', rule? }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRule, setConfirmRule] = useState(null);
  const [confirmResult, setConfirmResult] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadRules = useCallback(async (pg) => {
    setLoading(true);
    const data = await BillingService.rules(uuid, { per_page: 15, page: pg });
    if (data?.data) { setRules(data.data); setMeta(data.meta); }
    setLoading(false);
  }, [uuid]);

  useEffect(() => { loadRules(1); }, [loadRules]);

  const promptDelete = useCallback((rule) => {
    setConfirmRule(rule);
    setConfirmResult(null);
    setConfirmOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmRule) return;
    setConfirmLoading(true);
    setConfirmResult(null);
    try {
      const res = await BillingService.updateRule(confirmRule.uuid, { status: 'inactive' }, { showLoader: false });
      if (res?.success) {
        setConfirmResult({ type: 'success', message: 'Rule deactivated successfully.' });
        loadRules(page);
      } else {
        setConfirmResult({ type: 'error', message: res?.message || 'Failed to deactivate rule.' });
      }
    } catch {
      setConfirmResult({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmRule, page, loadRules]);

  const handleClose = useCallback(() => {
    setConfirmOpen(false);
    setConfirmResult(null);
    setConfirmRule(null);
  }, []);

  const fmtCents = (c, cur) => `${cur || 'TZS'} ${(c / 100).toFixed(2)}`;

  const pageNums = useMemo(() => {
    if (!meta || meta.last_page <= 1) return [];
    const start = Math.max(1, Math.min(meta.last_page - 4, page - 2));
    return Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => start + i);
  }, [meta, page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{meta ? `${meta.total} rules` : 'Loading…'}</p>
        <button onClick={() => setModal({ mode: 'create' })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Range</th>
              <th>Price</th>
              <th>Effective</th>
              <th>Sort</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 4 }, (_, i) => (
              <tr key={i}>
                <td><Skel w="w-20" h="h-3.5" /></td>
                <td><Skel w="w-24" h="h-3" /></td>
                <td><Skel w="w-32" h="h-3" /></td>
                <td><Skel w="w-8" h="h-3" /></td>
                <td><Skel w="w-14" h="h-5" /></td>
                <td className="text-right"><Skel w="w-16" h="h-7" /></td>
              </tr>
            ))}
            {!loading && rules.length === 0 && (
              <tr><td colSpan={6} className="text-center py-14 text-gray-400 text-sm">No rules found</td></tr>
            )}
            {!loading && rules.map((r) => (
              <tr key={r.uuid}>
                <td className="text-sm font-medium text-gray-900">
                  {r.range_start} {r.range_end ? `– ${r.range_end}` : '+'}
                  <span className="text-gray-400 font-normal text-xs ml-1">units</span>
                </td>
                <td className="text-sm text-gray-700 font-mono">{fmtCents(r.price_cents, r.currency)}</td>
                <td className="text-xs text-gray-500">
                  {r.effective_from} {r.effective_to ? `→ ${r.effective_to}` : ''}
                </td>
                <td className="text-sm text-gray-700">{r.sort_order}</td>
                <td><Badge map={RULE_STATUS_MAP} value={r.status} /></td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setModal({ mode: 'edit', rule: r })}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                      Edit
                    </button>
                    <button onClick={() => promptDelete(r)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 border border-red-100 hover:bg-red-50 transition-colors">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {pageNums.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-white">
            <p className="text-xs text-gray-400">Showing {meta.from}–{meta.to} of {meta.total}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => { const p = Math.max(1, page - 1); setPage(p); loadRules(p); }} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">← Prev</button>
              {pageNums.map((pg) => (
                <button key={pg} onClick={() => { setPage(pg); loadRules(pg); }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-primary-600 text-white' : 'text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{pg}</button>
              ))}
              <button onClick={() => { const p = Math.min(meta.last_page, page + 1); setPage(p); loadRules(p); }} disabled={page === meta.last_page}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        onClose={handleClose}
        onConfirm={handleDeleteConfirm}
        onRetry={handleDeleteConfirm}
        title="Deactivate Rule"
        message={confirmRule ? `Deactivate rule "${confirmRule.range_start}${confirmRule.range_end ? `–${confirmRule.range_end}` : '+'} units"? This will mark it as inactive.` : ''}
        confirmLabel="Deactivate"
        danger={true}
        loading={confirmLoading}
        result={confirmResult}
      />

      {modal && (
        <RuleModal
          profileUuid={uuid}
          profileCurrency={profile.currency}
          mode={modal.mode}
          rule={modal.rule}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); loadRules(page); }}
        />
      )}
    </div>
  );
}

function RuleModal({ profileUuid, profileCurrency, mode, rule, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    range_start: rule?.range_start ?? 1,
    range_end: rule?.range_end ?? '',
    price_cents: rule?.price_cents ?? 0,
    currency: rule?.currency ?? profileCurrency ?? 'TZS',
    effective_from: rule?.effective_from ?? new Date().toISOString().split('T')[0],
    effective_to: rule?.effective_to ?? '',
    sort_order: rule?.sort_order ?? 0,
    status: rule?.status ?? 'active',
  });

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    const payload = {
      ...form,
      range_end: form.range_end === '' ? null : parseInt(form.range_end, 10),
      effective_to: form.effective_to === '' ? null : form.effective_to,
      price_cents: parseInt(form.price_cents, 10) || 0,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };

    try {
      const res = mode === 'create'
        ? await BillingService.storeRule(profileUuid, payload)
        : await BillingService.updateRule(rule.uuid, payload);
      if (res?.success) {
        useUiStore.getState().showNotification(mode === 'create' ? 'Rule added' : 'Rule updated');
        onSaved();
      } else if (res?.errors) {
        setErrors(res.errors);
        useUiStore.getState().showNotification('Please fix the errors below', 'error');
      } else if (res?.message) {
        setErrors({ general: [res.message] });
        useUiStore.getState().showNotification(res.message, 'error');
      }
    } catch {
      useUiStore.getState().showNotification('Network error. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const Field = ({ label, name, children }) => (
    <div>
      <label className="label text-xs">{label}</label>
      {children}
      {errors[name]?.map((e, i) => <p key={i} className="text-xs text-red-500 mt-1">{e}</p>)}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{mode === 'create' ? 'Add Billing Rule' : 'Edit Billing Rule'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errors.general?.map((e, i) => (
          <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{e}</div>
        ))}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Range Start" name="range_start">
              <input type="number" min={1} value={form.range_start} onChange={(e) => update('range_start', parseInt(e.target.value, 10) || 1)} className="input" />
            </Field>
            <Field label="Range End (optional)" name="range_end">
              <input type="number" min={1} value={form.range_end} onChange={(e) => update('range_end', e.target.value)} placeholder="∞" className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (cents)" name="price_cents">
              <input type="number" min={0} value={form.price_cents} onChange={(e) => update('price_cents', e.target.value)} className="input" />
            </Field>
            <Field label="Currency" name="currency">
              <input type="text" maxLength={3} value={form.currency} onChange={(e) => update('currency', e.target.value.toUpperCase())} className="input font-mono" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Effective From" name="effective_from">
              <input type="date" value={form.effective_from} onChange={(e) => update('effective_from', e.target.value)} className="input" />
            </Field>
            <Field label="Effective To (optional)" name="effective_to">
              <input type="date" value={form.effective_to} onChange={(e) => update('effective_to', e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Sort Order" name="sort_order">
              <input type="number" min={0} value={form.sort_order} onChange={(e) => update('sort_order', e.target.value)} className="input" />
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
              {saving ? 'Saving…' : mode === 'create' ? 'Add Rule' : 'Update Rule'}
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
}

export default function BillingProfileDetailPage() {
  const { uuid } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    BillingService.show(uuid).then((res) => {
      setProfile(res?.data ?? null);
      setLoading(false);
    });
  }, [uuid]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-2"><Skel w="w-48" h="h-5" /><Skel w="w-32" h="h-3.5" /></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="info-card p-5 space-y-3"><Skel /><Skel /><Skel /></div>
          </div>
          <div className="space-y-4"><div className="info-card p-5 space-y-3"><Skel /></div></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Billing Profiles
        </Link>
        <div className="card p-10 text-center text-gray-400">Billing profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Billing Profiles
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white text-lg font-bold"
              style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
              {(profile.name || 'B').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{profile.description || 'No description'}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge map={BILLING_STATUS_MAP} value={profile.status} />
                {profile.is_default && (
                  <span className="badge badge-amber">Default</span>
                )}
                <span className="badge badge-blue">{profile.billing_interval}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — scrollable with snap */}
      <div className="border-b border-gray-200 relative">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 sm:hidden" />
        <nav
          className="flex overflow-x-auto scroll-smooth scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {[
            { key: 'overview', label: 'Overview', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { key: 'rules', label: 'Rules', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`group flex items-center justify-center gap-2 min-w-[80px] sm:min-w-0 px-4 py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key
                ? 'border-primary-600 text-primary-700 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              style={{ scrollSnapAlign: 'start' }}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-1">
        {activeTab === 'overview' && <OverviewTab profile={profile} />}
        {activeTab === 'rules' && <RulesTab uuid={uuid} profile={profile} />}
      </div>
    </div>
  );
}
