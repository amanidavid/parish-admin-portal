'use client';
import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import HistoricalContractGrantService from '@/services/HistoricalContractGrantService';
import { fmtDateTime } from '@/lib/formatters';

// System (primary/orange) action button — used instead of the blue .btn-primary.
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed';

const RESULT_ICONS = {
  success: (
    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

/**
 * Flatten API validation errors into a single array of messages.
 */
function flattenErrors(errors) {
  if (!errors || typeof errors !== 'object') return [];
  return Object.values(errors).flat().filter(Boolean);
}

/**
 * Convert a datetime-local value ("YYYY-MM-DDTHH:MM") into the
 * "YYYY-MM-DD HH:MM:SS" format expected by the API.
 */
function toApiDateTime(value) {
  if (!value) return null;
  const normalized = String(value).replace('T', ' ');
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

const EMPTY_FORM = {
  start_from: '',
  start_to: '',
  active_from: '',
  expires_at: '',
  reason: '',
};

export default function HistoricalContractGrantModal({ tenantUuid, open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [apiMessage, setApiMessage] = useState('');

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiMessage('');
    setResult(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
    setTimeout(reset, 200);
  }, [loading, onClose, reset]);

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Lightweight client-side validation before hitting the API.
  const validate = useCallback(() => {
    const next = {};
    if (!form.start_from) next.start_from = ['Required.'];
    if (!form.start_to) next.start_to = ['Required.'];
    if (form.start_from && form.start_to && form.start_from > form.start_to) {
      next.start_to = ['End date must be on or after the start date.'];
    }
    if (!form.expires_at) next.expires_at = ['Required.'];
    if (!form.reason.trim()) next.reason = ['Required.'];
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setApiMessage('');
    setResult(null);

    try {
      const payload = {
        historical_start_date_from: form.start_from,
        historical_start_date_to: form.start_to,
        expires_at: toApiDateTime(form.expires_at),
        reason: form.reason.trim(),
      };
      if (form.active_from) payload.usable_from = toApiDateTime(form.active_from);

      const res = await HistoricalContractGrantService.create(tenantUuid, payload, { showLoader: false });
      if (res?.success) {
        setResult({ type: 'success', data: res.data, message: res.message });
        if (onSuccess) onSuccess(res.data);
      } else if (res?.errors && Object.keys(res.errors).length > 0) {
        setErrors(res.errors);
        setApiMessage(res?.message || '');
      } else {
        setResult({ type: 'error', message: res?.message || 'Failed to create grant. Please try again.' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [validate, form, tenantUuid, onSuccess]);

  const isResult = result !== null;
  const grant = result?.data;
  const errorMessages = flattenErrors(errors);

  return (
    <Modal open={open} onClose={handleClose} title="New contract entry grant" maxWidth="max-w-[650px]" panelClassName="rounded-[14px]">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Creating grant…</p>
        </div>
      )}

      {!loading && !isResult && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-gray-500 -mt-1">
            Temporarily allow a user to enter contracts with start dates from an earlier period.
          </p>

          {/* Scope callout */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-amber-800">
              This grant applies to <span className="font-semibold">all properties</span> in this workspace.
            </p>
          </div>

          {/* Section 1 — contract start range */}
          <section>
            <p className="text-sm font-semibold text-gray-800">Allowed contract start dates</p>
            <p className="text-xs text-gray-400 mt-0.5">The user may only enter contracts whose start date falls within this range.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_from}
                  onChange={(e) => setField('start_from', e.target.value)}
                  className="input w-full h-11 rounded-lg text-sm"
                  required
                />
                {errors.start_from?.map((msg, i) => (
                  <p key={i} className="text-xs text-red-500 mt-1">{msg}</p>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  To <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.start_to}
                  onChange={(e) => setField('start_to', e.target.value)}
                  className="input w-full h-11 rounded-lg text-sm"
                  required
                />
                {errors.start_to?.map((msg, i) => (
                  <p key={i} className="text-xs text-red-500 mt-1">{msg}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2 — grant access period */}
          <section>
            <p className="text-sm font-semibold text-gray-800">Grant access period</p>
            <p className="text-xs text-gray-400 mt-0.5">Choose when this permission becomes available and when it automatically ends.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Available from <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.active_from}
                  onChange={(e) => setField('active_from', e.target.value)}
                  className="input w-full h-11 rounded-lg text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">Leave blank to activate immediately.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Expires on <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setField('expires_at', e.target.value)}
                  className="input w-full h-11 rounded-lg text-sm"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">Access is revoked automatically.</p>
                {errors.expires_at?.map((msg, i) => (
                  <p key={i} className="text-xs text-red-500 mt-1">{msg}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 — reason */}
          <section>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Reason for granting access <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) => setField('reason', e.target.value)}
              maxLength={250}
              className="input w-full rounded-lg text-sm min-h-[88px]"
              placeholder="Briefly explain why this temporary access is needed."
              required
            />
            <div className="flex items-start justify-between gap-3 mt-1">
              <div className="flex-1">
                {errors.reason?.map((msg, i) => (
                  <p key={i} className="text-xs text-red-500">{msg}</p>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 shrink-0">{form.reason.length} / 250</p>
            </div>
          </section>

          {errorMessages.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 space-y-1">
              {apiMessage && <p className="text-xs font-semibold text-red-700">{apiMessage}</p>}
              {errorMessages.map((msg, i) => (
                <p key={i} className="text-xs text-red-600">{msg}</p>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="-mx-5 -mb-5 mt-6 flex justify-end gap-3 rounded-b-[14px] border-t border-gray-100 bg-gray-50 px-5 py-4">
            <button type="button" className="btn-secondary rounded-lg" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={BTN_PRIMARY} disabled={loading}>
              Create grant
            </button>
          </div>
        </form>
      )}

      {!loading && isResult && (
        <div className="flex flex-col items-center gap-3 py-2">
          {RESULT_ICONS[result.type]}
          {result.message && <p className="text-sm text-gray-600 text-center">{result.message}</p>}
          {result.type === 'error' && errorMessages.length > 0 && !result.message && (
            <div className="w-full rounded-lg bg-red-50 border border-red-100 p-3 space-y-1">
              {errorMessages.map((msg, i) => (
                <p key={i} className="text-xs text-red-600 text-center">{msg}</p>
              ))}
            </div>
          )}
          {result.type === 'success' && grant && (
            <div className="w-full rounded-lg bg-green-50 border border-green-100 p-3 text-center space-y-1">
              <p className="text-xs text-gray-500">
                {grant.property?.name ? `${grant.property.name} · ` : ''}Expires {fmtDateTime(grant.expires_at)}
              </p>
              <p className="text-xs text-gray-400 font-mono break-all">{grant.uuid}</p>
            </div>
          )}
          <div className="flex justify-center gap-3 mt-2">
            {result.type === 'error' && (
              <button type="button" className={BTN_PRIMARY} onClick={handleSubmit}>
                Retry
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
