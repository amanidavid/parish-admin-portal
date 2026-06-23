'use client';
import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BillingService from '@/services/BillingService';
import useUiStore from '@/store/uiStore';
import { BILLING_CURRENCIES } from '@/constants/status';

function Field({ label, name, children, hint, errors }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      {errors[name]?.map((e, i) => (
        <p key={i} className="text-xs text-red-500 mt-1">{e}</p>
      ))}
    </div>
  );
}

export default function CreateBillingRulePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    range_start: 1,
    range_end: '',
    price_cents: 0,
    currency: 'TZS',
    effective_from: new Date().toISOString().split('T')[0],
    effective_to: '',
    sort_order: 0,
    status: 'active',
  });

  const update = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const payload = {
        ...form,
        range_end: form.range_end === '' ? null : parseInt(form.range_end, 10),
        price_cents: parseInt(form.price_cents, 10) || 0,
        sort_order: parseInt(form.sort_order, 10) || 0,
        effective_to: form.effective_to === '' ? null : form.effective_to,
      };
      const res = await BillingService.store(payload);
      if (res?.success && res?.data?.uuid) {
        useUiStore.getState().showNotification('Billing rule created');
        router.push(`/billing/${res.data.uuid}/edit`);
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
  }, [form, router]);

  return (
    <div className="space-y-6">
      <Link href="/billing" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Billing Rules
      </Link>

      <div className="card p-6 max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Create Billing Rule</h1>
        <p className="text-sm text-gray-400 mb-6">Define a unit-range pricing rule.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errors.general?.map((e, i) => (
            <div key={i} className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">{e}</div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Range Start" name="range_start" hint="Minimum units">
              <input type="number" min={1} value={form.range_start}
                onChange={(e) => update('range_start', parseInt(e.target.value, 10) || 1)} className="input" />
            </Field>
            <Field errors={errors} label="Range End" name="range_end" hint="Leave blank for unlimited">
              <input type="number" min={1} value={form.range_end}
                onChange={(e) => update('range_end', e.target.value)} className="input" placeholder="∞" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Price (cents)" name="price_cents" hint="e.g. 5000 = TZS 50.00">
              <input type="number" min={0} value={form.price_cents}
                onChange={(e) => update('price_cents', e.target.value)} className="input" />
            </Field>
            <Field errors={errors} label="Currency" name="currency">
              <select value={form.currency} onChange={(e) => update('currency', e.target.value)} className="input">
                {BILLING_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Effective From" name="effective_from">
              <input type="date" value={form.effective_from}
                onChange={(e) => update('effective_from', e.target.value)} className="input" />
            </Field>
            <Field errors={errors} label="Effective To" name="effective_to" hint="Leave blank for no end date">
              <input type="date" value={form.effective_to}
                onChange={(e) => update('effective_to', e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field errors={errors} label="Sort Order" name="sort_order" hint="Display order">
              <input type="number" min={0} value={form.sort_order}
                onChange={(e) => update('sort_order', e.target.value)} className="input" />
            </Field>
            <Field errors={errors} label="Status" name="status">
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
              {saving ? 'Creating…' : 'Create Rule'}
            </button>
            <Link href="/billing"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
