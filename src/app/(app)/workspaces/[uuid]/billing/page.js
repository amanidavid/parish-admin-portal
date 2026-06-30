'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel } from '@/components/ui';
import { fmtCents, fmtDateTime } from '@/lib/formatters';

const TIMING_OPTS = [
  { value: 'immediate_prorated', label: 'Immediately (prorated)' },
  { value: 'next_cycle', label: 'Next billing cycle' },
];

export default function ChangeBillingRulePage() {
  const { uuid } = useParams();
  const router = useRouter();
  const [currentSub, setCurrentSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timing, setTiming] = useState('immediate_prorated');
  const [unitPriceCents, setUnitPriceCents] = useState('');
  const [currency, setCurrency] = useState('TZS');
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().split('T')[0]);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    WorkspaceService.subscription(uuid).then((sRes) => {
      const sub = sRes?.data ?? null;
      setCurrentSub(sub);
      const br = sub?.subscription?.billing_rule;
      if (br) {
        setUnitPriceCents(String(br.unit_price_cents ?? ''));
        setCurrency(br.currency || 'TZS');
      }
      setLoading(false);
    });
  }, [uuid]);

  const handlePreview = useCallback(async () => {
    const up = parseInt(unitPriceCents, 10);
    if (!up || up <= 0) return;
    setPreviewLoading(true);
    setError('');
    setPreview(null);
    const res = await WorkspaceService.previewBillingRuleChange(uuid, {
      unit_price_cents: up,
      currency,
      effective_from: effectiveFrom,
      change_timing: timing,
    });
    setPreviewLoading(false);
    if (res?.success) { setPreview(res.data); }
    else if (res?.message) { setError(res.message); }
    else if (res?.errors) { setError(Object.values(res.errors).flat().join(', ')); }
  }, [unitPriceCents, currency, effectiveFrom, timing, uuid]);

  const handleApply = useCallback(async () => {
    const up = parseInt(unitPriceCents, 10);
    if (!up || up <= 0) return;
    setApplying(true);
    setError('');
    const res = await WorkspaceService.assignBillingRule(uuid, {
      unit_price_cents: up,
      currency,
      effective_from: effectiveFrom,
      change_timing: timing,
    });
    setApplying(false);
    if (res?.success) {
      router.push(`/workspaces/${uuid}`);
    } else if (res?.message) {
      setError(res.message);
    } else if (res?.errors) {
      setError(Object.values(res.errors).flat().join(', '));
    }
  }, [unitPriceCents, currency, effectiveFrom, timing, uuid, router]);


  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-6 space-y-5">
          <Skel w="w-48" h="h-6" /><Skel w="w-full" h="h-10" /><Skel w="w-full" h="h-10" />
        </div>
      </div>
    );
  }

  const currentBp = currentSub?.subscription?.billing_rule;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href={`/workspaces/${uuid}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workspace
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Change Billing Rule</h1>
        <p className="text-sm text-gray-400 mb-6">Preview pricing impact before applying a new billing rule.</p>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 mb-5">{error}</div>
        )}

        {/* Current rule */}
        {currentBp && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 mb-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Current Billing Rule</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{currentBp.workspace_name || 'Workspace Rule'}</p>
            <p className="text-xs text-gray-500">{fmtCents(currentBp.unit_price_cents, currentBp.currency)} per unit · {currentBp.currency}</p>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label text-xs">Unit Price (cents)</label>
              <input
                type="number" min={0}
                value={unitPriceCents}
                onChange={(e) => { setUnitPriceCents(e.target.value); setPreview(null); setError(''); }}
                className="input"
                placeholder="e.g. 1000"
              />
            </div>
            <div>
              <label className="label text-xs">Currency</label>
              <select value={currency} onChange={(e) => { setCurrency(e.target.value); setPreview(null); }} className="input">
                <option value="TZS">TZS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label text-xs">Effective From</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => { setEffectiveFrom(e.target.value); setPreview(null); }}
              className="input"
            />
          </div>
          <div>
            <label className="label text-xs">Change Timing</label>
            <select value={timing} onChange={(e) => { setTiming(e.target.value); setPreview(null); }} className="input">
              {TIMING_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button
            onClick={handlePreview}
            disabled={!unitPriceCents || previewLoading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
          >
            {previewLoading ? 'Previewing…' : 'Preview Change'}
          </button>
        </div>

        {/* Preview result */}
        {preview && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
            <p className="text-sm font-bold text-gray-900">Change Preview</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Current Price</p>
                <p className="font-semibold text-gray-900">{fmtCents(preview.pricing.current_estimated_price_cents, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">New Price</p>
                <p className="font-semibold text-gray-900">{fmtCents(preview.pricing.new_estimated_price_cents, currency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Delta</p>
                <p className={`font-semibold ${preview.pricing.delta_price_cents >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {preview.pricing.delta_price_cents >= 0 ? '+' : ''}{fmtCents(preview.pricing.delta_price_cents, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Effective At</p>
                <p className="font-semibold text-gray-900">{fmtDateTime(preview.effective_at)}</p>
              </div>
            </div>

            {preview.proration?.applies && (
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 text-sm">
                <p className="font-semibold text-amber-800">Proration ({preview.proration.adjustment_type})</p>
                <p className="text-amber-700 mt-1">
                  {fmtCents(preview.proration.prorated_adjustment_cents, currency)} for {preview.proration.remaining_cycle_days} of {preview.proration.total_cycle_days} days remaining
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}
              >
                {applying ? 'Applying…' : 'Confirm & Apply'}
              </button>
              <button
                onClick={() => { setPreview(null); setUnitPriceCents(''); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
