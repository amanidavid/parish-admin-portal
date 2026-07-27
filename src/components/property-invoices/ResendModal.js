'use client';
import { useState, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import PropertyInvoiceService from '@/services/PropertyInvoiceService';

const CHANNEL_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'both', label: 'Both' },
];

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

export default function ResendModal({ open, onClose, onSuccess, mode, target, selectedUuids }) {
  const [channel, setChannel] = useState('both');
  const [force, setForce] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const reset = useCallback(() => {
    setChannel('both');
    setForce(true);
    setResult(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    onClose();
    setTimeout(reset, 200);
  }, [loading, onClose, reset]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (mode === 'single' && target) {
        res = await PropertyInvoiceService.resendReminder(target.uuid, { channel, force }, { showLoader: false });
      } else if (mode === 'bulk' && selectedUuids.length > 0) {
        res = await PropertyInvoiceService.resendReminders(
          { channel, force, invoice_uuids: selectedUuids, limit: selectedUuids.length },
          { showLoader: false }
        );
      }
      if (res?.success) {
        setResult({ type: 'success', data: res.data, message: res.message });
      } else if (res?.errors) {
        // Validation errors - show detailed field errors
        const errorMessages = Object.entries(res.errors)
          .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
          .join('; ');
        setResult({ type: 'error', message: res?.message || 'Validation failed', errors: res.errors, errorMessages });
      } else {
        setResult({ type: 'error', message: res?.message || 'Resend failed. Please try again.' });
      }
    } catch (err) {
      const isNetworkError = err?.message?.toLowerCase().includes('network') || err?.message?.toLowerCase().includes('fetch');
      setResult({
        type: 'error',
        message: isNetworkError ? 'Network error. Please check your connection and try again.' : (err?.message || 'Something went wrong. Please try again.'),
        isNetworkError
      });
    } finally {
      setLoading(false);
    }
  }, [mode, target, selectedUuids, channel, force]);

  const isResult = result !== null;
  const channels = result?.data?.channels || [];
  const summary = result?.data?.summary || {};

  return (
    <Modal open={open} onClose={handleClose} title={mode === 'single' ? 'Resend Invoice Reminder' : 'Bulk Resend Reminders'} maxWidth="max-w-2xl">
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Processing resend…</p>
        </div>
      )}

      {!loading && !isResult && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
            <div className="flex gap-3">
              {CHANNEL_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="channel"
                    value={opt.value}
                    checked={channel === opt.value}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={force}
                onChange={(e) => setForce(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Force resend (override previous attempts)</span>
            </label>
          </div>

          {mode === 'single' && target && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm">
              <p className="text-xs text-gray-400">Invoice</p>
              <p className="font-medium text-gray-900">{target.invoice_number || '—'}</p>
            </div>
          )}

          {mode === 'bulk' && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-sm">
              <p className="text-xs text-gray-400">Selected invoices</p>
              <p className="font-medium text-gray-900">{selectedUuids.length} invoice{selectedUuids.length !== 1 ? 's' : ''}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              Resend
            </button>
          </div>
        </form>
      )}

      {!loading && isResult && (
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col items-center gap-3">
            {RESULT_ICONS[result.type]}
            <p className="text-sm text-gray-600 text-center">{result.message}</p>
            {result.errorMessages && (
              <p className="text-xs text-red-500 text-center mt-1">{result.errorMessages}</p>
            )}
          </div>

          {result.type === 'success' && channels.length > 0 && (
            <div className="space-y-3">
              {channels.map((ch) => (
                <div key={ch.channel} className="rounded-lg border border-gray-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase">{ch.channel}</span>
                    <span className="text-xs text-gray-500">{ch.message}</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600 font-medium">Sent: {ch.sent_count}</span>
                    <span className="text-red-600 font-medium">Failed: {ch.failed_count}</span>
                    <span className="text-gray-500">Skipped: {ch.skipped_count}</span>
                  </div>
                  {ch.items && ch.items.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {ch.items.map((item, i) => (
                        <div key={i} className="text-xs flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${item.status === 'sent' ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-gray-600">{item.recipient_address}</span>
                          {item.status === 'failed' && item.message && (
                            <span className="text-red-500 truncate ml-2" title={item.message}>{item.message}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result.type === 'success' && summary && (
            <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-900">
                {summary.sent_count} sent, {summary.failed_count} failed, {summary.skipped_count} skipped
              </p>
            </div>
          )}

          <div className="flex justify-center gap-3 mt-2">
            {result.type === 'error' && (
              <button type="button" className="btn-primary" onClick={handleSubmit}>
                Retry
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onSuccess}>
              {result.type === 'success' ? 'Done' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
