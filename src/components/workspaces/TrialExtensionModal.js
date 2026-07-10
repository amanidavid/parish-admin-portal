'use client';
import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import WorkspaceService from '@/services/WorkspaceService';
import { fmtDate } from '@/lib/formatters';

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

export default function TrialExtensionModal({ uuid, open, onClose, onSuccess }) {
  const [days, setDays] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const reset = useCallback(() => {
    setDays(0);
    setReason('');
    setErrors({});
    setResult(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
    setTimeout(reset, 200);
  }, [loading, onClose, reset]);

  const handleDaysChange = useCallback((e) => {
    const val = e.target.value;
    if (val === '') {
      setDays('');
      return;
    }
    const num = parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 0) {
      setDays(num);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setResult(null);
    try {
      const payload = { days: Number(days) || 0 };
      if (reason.trim()) payload.reason = reason.trim();
      const res = await WorkspaceService.extendTrial(uuid, payload, { showLoader: false });
      if (res?.success) {
        setResult({ type: 'success', data: res.data, message: res.message });
        if (onSuccess) onSuccess(res.data);
      } else if (res?.errors && Object.keys(res.errors).length > 0) {
        setErrors(res.errors);
      } else {
        setResult({ type: 'error', message: res?.message || '' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [uuid, days, reason, onSuccess]);

  const isResult = result !== null;
  const trialExtension = result?.data?.trial_extension;
  const errorMessages = flattenErrors(errors);

  return (
    <Modal open={open} onClose={handleClose} title="Extend Free Trial" maxWidth="max-w-md">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Extending trial…</p>
        </div>
      )}

      {!loading && !isResult && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Days <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              pattern="[0-9]*"
              value={days}
              onChange={handleDaysChange}
              className="input w-full text-sm py-2"
              placeholder="0"
              required
              autoFocus
            />
            {errors.days?.map((msg, i) => (
              <p key={i} className="text-xs text-red-500 mt-1">{msg}</p>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full text-sm py-2 min-h-[80px]"
              placeholder="e.g. Manual extension approved"
            />
            {errors.reason?.map((msg, i) => (
              <p key={i} className="text-xs text-red-500 mt-1">{msg}</p>
            ))}
          </div>

          {errorMessages.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3 space-y-1">
              {errorMessages.map((msg, i) => (
                <p key={i} className="text-xs text-red-600">{msg}</p>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              Extend Trial
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
          {result.type === 'success' && trialExtension && (
            <div className="w-full rounded-lg bg-green-50 border border-green-100 p-3 text-center space-y-1">
              <p className="text-xs text-gray-500">New trial ends at</p>
              <p className="text-sm font-semibold text-gray-900">{fmtDate(trialExtension.new_trial_ends_at)}</p>
              {trialExtension.old_trial_ends_at && (
                <p className="text-xs text-gray-400">
                  Extended from {fmtDate(trialExtension.old_trial_ends_at)}
                </p>
              )}
            </div>
          )}
          <div className="flex justify-center gap-3 mt-2">
            {result.type === 'error' && (
              <button type="button" className="btn-primary" onClick={handleSubmit}>
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
