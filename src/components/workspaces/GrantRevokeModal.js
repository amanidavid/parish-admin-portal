'use client';
import { useState, useCallback, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import HistoricalContractGrantService from '@/services/HistoricalContractGrantService';

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
 * Revoke a historical contract entry grant. Requires a reason.
 */
export default function GrantRevokeModal({ tenantUuid, grant, open, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setReason('');
    setResult(null);
    setError('');
    setLoading(false);
  }, []);

  // Reset internal state whenever a different grant is targeted.
  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
    setTimeout(reset, 200);
  }, [loading, onClose, reset]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is required to revoke a grant.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await HistoricalContractGrantService.revoke(
        tenantUuid,
        grant?.uuid,
        { reason: reason.trim() },
        { showLoader: false }
      );
      if (res?.success) {
        setResult({ type: 'success', message: res.message || 'Grant revoked successfully.' });
        if (onSuccess) onSuccess(res.data);
      } else if (res?.errors?.reason) {
        setError(Array.isArray(res.errors.reason) ? res.errors.reason[0] : res.errors.reason);
      } else {
        setResult({ type: 'error', message: res?.message || 'Failed to revoke grant. Please try again.' });
      }
    } catch (err) {
      setResult({ type: 'error', message: err?.message || 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [reason, tenantUuid, grant, onSuccess]);

  const isResult = result !== null;

  return (
    <Modal open={open} onClose={handleClose} title="Revoke Grant" maxWidth="max-w-md">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Revoking grant…</p>
        </div>
      )}

      {!loading && !isResult && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Revoke this grant? Once revoked, it can no longer be used for historical contract entry.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full text-sm py-2 min-h-[80px]"
              placeholder="e.g. Historical contract correction has been completed."
              required
              autoFocus
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-danger" disabled={loading}>
              Revoke Grant
            </button>
          </div>
        </form>
      )}

      {!loading && isResult && (
        <div className="flex flex-col items-center gap-3 py-2">
          {RESULT_ICONS[result.type]}
          <p className="text-sm text-gray-600 text-center">{result.message}</p>
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
