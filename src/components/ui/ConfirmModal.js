'use client';
import Modal from './Modal';

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

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  onRetry,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  loading = false,
  result = null,
  danger = false,
}) {
  const isResult = result !== null;
  const resultTitle = result?.type === 'success' ? 'Success' : result?.type === 'error' ? 'Error' : title;

  return (
    <Modal open={open} onClose={isResult ? onClose : undefined} title={isResult ? resultTitle : title} maxWidth="max-w-md">
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-8">
          <svg className="animate-spin w-8 h-8 text-primary-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-sm text-gray-500">Processing…</p>
        </div>
      )}

      {/* Confirm state */}
      {!loading && !isResult && (
        <>
          <p className="text-sm text-gray-600 mb-6">{message}</p>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={danger ? 'btn-danger' : 'btn-primary'}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </>
      )}

      {/* Result state */}
      {!loading && isResult && (
        <div className="flex flex-col items-center gap-3 py-2">
          {RESULT_ICONS[result.type]}
          <p className="text-sm text-gray-600 text-center">{result.message}</p>
          <div className="flex justify-center gap-3 mt-2">
            {result.type === 'error' && onRetry && (
              <button type="button" className="btn-primary" onClick={onRetry}>
                Retry
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
