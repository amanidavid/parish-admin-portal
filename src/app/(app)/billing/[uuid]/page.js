'use client';
import { useEffect, useState, useCallback, memo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BillingService from '@/services/BillingService';
import { Skel, Badge, InfoRow } from '@/components/ui';
import { fmtCents } from '@/lib/formatters';
import { BILLING_STATUS_MAP, BILLING_CURRENCIES } from '@/constants/status';

function Field({ label, name, children, hint, required, errors }) {
  return (
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
}

const RuleModal = memo(function RuleModal({ mode, rule, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [form, setForm] = useState({
    unit_price_cents: String(rule?.unit_price_cents ?? ''),
    currency: rule?.currency ?? 'TZS',
    effective_from: rule?.effective_from ?? new Date().toISOString().split('T')[0],
    effective_to: rule?.effective_to ?? '',
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
      unit_price_cents: parseInt(form.unit_price_cents, 10) || 0,
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
            <Field errors={errors} label="Unit Price (cents)" name="unit_price_cents" required>
              <input type="number" min={0} value={form.unit_price_cents}
                onChange={(e) => update('unit_price_cents', e.target.value)} className="input" />
            </Field>
            <Field errors={errors} label="Currency" name="currency">
              <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input">
                {BILLING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Effective From" name="effective_from" required>
              <input type="date" value={form.effective_from}
                onChange={(e) => update('effective_from', e.target.value)} className="input" />
            </Field>
            <Field errors={errors} label="Effective To" name="effective_to">
              <input type="date" value={form.effective_to}
                onChange={(e) => update('effective_to', e.target.value)} className="input" />
            </Field>
          </div>
          <div>
            <Field errors={errors} label="Status" name="status">
              <select value={form.status} onChange={(e) => update('status', e.target.value)} className="input w-full">
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

export default function BillingRuleDetailPage() {
  const { uuid } = useParams();
  const [rule, setRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    BillingService.show(uuid).then((res) => {
      setRule(res?.data ?? null);
      setLoading(false);
    });
  }, [uuid]);

  const fmtDate = useCallback((d) => d ? new Date(d).toLocaleDateString('en-GB') : '—', []);

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

  if (!rule) {
    return (
      <div className="space-y-6">
        <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Billing Rules
        </Link>
        <div className="card p-10 text-center text-gray-400">Billing rule not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Billing Rules
      </Link>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white text-lg font-bold"
              style={{ background: 'linear-gradient(135deg,#0891b2,#22d3ee)' }}>
              {(rule.workspace_name || 'W').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{rule.workspace_name || 'Billing Rule'}</h1>
              <p className="text-sm text-gray-400 mt-0.5">{fmtCents(rule.unit_price_cents, rule.currency)} per unit</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge map={BILLING_STATUS_MAP} value={rule.status} />
                <span className="badge badge-blue">{rule.currency}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Rule Details</span></div>
            <div className="info-card-body">
              <InfoRow label="Unit Price" value={fmtCents(rule.unit_price_cents, rule.currency)} />
              <InfoRow label="Workspace" value={rule.workspace_name || '—'} />
              <InfoRow label="Currency" value={rule.currency} mono />
              <InfoRow label="Effective From" value={fmtDate(rule.effective_from)} />
              <InfoRow label="Effective To" value={fmtDate(rule.effective_to) || 'No end date'} />
              <InfoRow label="Status" value={<Badge map={BILLING_STATUS_MAP} value={rule.status} />} />
              <InfoRow label="Created" value={fmtDate(rule.created_at)} />
              <InfoRow label="Updated" value={fmtDate(rule.updated_at)} />
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="info-card">
            <div className="info-card-header"><span className="info-card-title">Actions</span></div>
            <div className="p-3 space-y-2">
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors text-left">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Rule
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && rule && (
        <RuleModal
          mode="edit"
          rule={rule}
          onClose={() => setModalOpen(false)}
          onSaved={(res) => {
            setModalOpen(false);
            if (res?.data) setRule(res.data);
          }}
        />
      )}
    </div>
  );
}
