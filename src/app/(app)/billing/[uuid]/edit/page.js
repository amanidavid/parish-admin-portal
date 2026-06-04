'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BillingService from '@/services/BillingService';
import useUiStore from '@/store/uiStore';
import { BILLING_CURRENCIES, BILLING_INTERVALS } from '@/constants/status';

function Field({ label, name, children, hint, errors }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {errors[name]?.map((e, i) => <p key={i} className="text-xs text-red-500 mt-1">{e}</p>)}
    </div>
  );
}

export default function EditBillingProfilePage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', description: '', billing_interval: 'monthly', trial_days: 14, grace_days: 7,
    currency: 'TZS', is_default: false, status: 'active',
  });

  useEffect(() => {
    BillingService.show(uuid).then((res) => {
      const p = res?.data;
      if (p) {
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          billing_interval: p.billing_interval ?? 'monthly',
          trial_days: p.trial_days ?? 14,
          grace_days: p.grace_days ?? 7,
          currency: p.currency ?? 'TZS',
          is_default: !!p.is_default,
          status: p.status ?? 'active',
        });
      }
      setLoading(false);
    });
  }, [uuid]);

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const res = await BillingService.update(uuid, form);
      if (res?.success) {
        useUiStore.getState().showNotification('Billing profile updated');
        router.push(`/billing/${uuid}`);
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
  }, [form, uuid, router]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-6 space-y-5">
          <div className="space-y-2"><div className="animate-pulse bg-gray-100 rounded w-48 h-6" /><div className="animate-pulse bg-gray-100 rounded w-32 h-4" /></div>
          <div className="space-y-3"><div className="animate-pulse bg-gray-100 rounded h-10" /><div className="animate-pulse bg-gray-100 rounded h-10" /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/billing/${uuid}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Profile
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Billing Profile</h1>
        <p className="text-sm text-gray-400 mb-6">Update pricing metadata without affecting rule history.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general?.map((e, i) => (
            <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{e}</div>
          ))}

          <Field errors={errors} label="Profile Name" name="name">
            <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} className="input" />
          </Field>

          <Field errors={errors} label="Description" name="description">
            <textarea value={form.description} onChange={(e) => update('description', e.target.value)}
              className="input min-h-[80px] resize-y" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Billing Interval" name="billing_interval">
              <select value={form.billing_interval} onChange={(e) => update('billing_interval', e.target.value)} className="input">
                {BILLING_INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </Field>
            <Field errors={errors} label="Currency" name="currency">
              <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input">
                {BILLING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Trial Days" name="trial_days">
              <input type="number" min={0} max={365} value={form.trial_days}
                onChange={(e) => update('trial_days', parseInt(e.target.value, 10) || 0)} className="input" />
            </Field>
            <Field errors={errors} label="Grace Days" name="grace_days">
              <input type="number" min={0} max={365} value={form.grace_days}
                onChange={(e) => update('grace_days', parseInt(e.target.value, 10) || 0)} className="input" />
            </Field>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_default}
                onChange={(e) => update('is_default', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700 font-medium">Set as default</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.status === 'active'}
                onChange={(e) => update('status', e.target.checked ? 'active' : 'inactive')}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              <span className="text-sm text-gray-700 font-medium">Active</span>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link href={`/billing/${uuid}`}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
