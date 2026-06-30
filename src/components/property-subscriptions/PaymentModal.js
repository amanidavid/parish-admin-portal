'use client';
import { useState, useCallback } from 'react';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import { fmt, fmtCents, fmtDate } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

export default function PaymentModal({ workspaceUuid, property, onClose, onSuccess }) {
  const [step, setStep] = useState('form'); // form | previewing | preview | recording | success | error
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const { showNotification } = useUiStore();

  const [form, setForm] = useState({
    property_uuid: property?.property_uuid || '',
    months_paid: 1,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handlePreview = useCallback(async () => {
    if (!form.months_paid || !form.payment_date) {
      showNotification('Please fill in all required fields.', 'error');
      return;
    }
    setStep('previewing');
    try {
      const res = await PropertySubscriptionService.previewPayment(workspaceUuid, {
        property_uuid: form.property_uuid,
        months_paid: parseInt(form.months_paid, 10),
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        notes: form.notes,
      }, { showLoader: false });
      if (res?.success && res.data) {
        setPreview(res.data);
        setStep('preview');
      } else {
        throw new Error(res?.message || 'Preview failed');
      }
    } catch (e) {
      setError(e?.message || 'Failed to preview payment');
      setStep('error');
    }
  }, [form, workspaceUuid, showNotification]);

  const handleRecord = useCallback(async () => {
    setStep('recording');
    try {
      const res = await PropertySubscriptionService.recordPayment(workspaceUuid, {
        property_uuid: form.property_uuid,
        months_paid: parseInt(form.months_paid, 10),
        payment_date: form.payment_date,
        reference_number: form.reference_number,
        notes: form.notes,
      }, { showLoader: false });
      if (res?.success) {
        setStep('success');
        showNotification('Payment recorded successfully.', 'success');
        onSuccess?.();
      } else {
        throw new Error(res?.message || 'Failed to record payment');
      }
    } catch (e) {
      setError(e?.message || 'Failed to record payment');
      setStep('error');
    }
  }, [form, workspaceUuid, onSuccess, showNotification]);

  const resetForm = useCallback(() => {
    setPreview(null);
    setError(null);
    setForm({
      property_uuid: property?.property_uuid || '',
      months_paid: 1,
      payment_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setStep('form');
  }, [property]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">
            {step === 'success' ? 'Payment Recorded' : 'Record Payment'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {step === 'form' && (
            <>
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">{property?.name}</p>
                <p className="text-gray-500">Units: {fmt(property?.current_registered_units_total)}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Months Paid <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={form.months_paid}
                    onChange={(e) => setForm((p) => ({ ...p, months_paid: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={form.payment_date}
                    onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))}
                    className="input w-full text-sm py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    className="input w-full text-sm py-2 min-h-[80px]"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handlePreview}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Preview Payment
                </button>
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </>
          )}

          {(step === 'previewing' || step === 'recording') && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 border-3 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-500">{step === 'previewing' ? 'Generating preview...' : 'Recording payment...'}</p>
            </div>
          )}

          {step === 'preview' && preview && (
            <>
              <div className="space-y-3">
                <div className="bg-orange-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Monthly Price</span>
                    <span className="font-semibold text-gray-900">{fmtCents(preview.payment?.monthly_price_cents)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Months Paid</span>
                    <span className="font-semibold text-gray-900">{preview.payment?.months_paid}</span>
                  </div>
                  <div className="border-t border-orange-200 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-800">Total Amount</span>
                    <span className="font-bold text-lg text-orange-600">{fmtCents(preview.payment?.total_amount_cents)}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coverage Start</span>
                    <span className="font-medium text-gray-800">{fmtDate(preview.coverage?.starts_on)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Coverage End</span>
                    <span className="font-medium text-gray-800">{fmtDate(preview.coverage?.ends_on)}</span>
                  </div>
                  {preview.coverage?.starts_from_payment_date && (
                    <p className="text-xs text-amber-600">Coverage starts from payment date</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="text-gray-500 text-xs mb-1">Subscription After</p>
                  <p className="font-medium text-gray-800">{preview.subscription_after?.effective_status}</p>
                  <p className="text-xs text-gray-400">Until {fmtDate(preview.subscription_after?.current_period_ends_on)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleRecord}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>
                  Confirm & Record
                </button>
                <button onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Back
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="mt-3 text-base font-semibold text-gray-900">Payment Recorded</p>
              <p className="mt-1 text-sm text-gray-500">The subscription has been updated successfully.</p>
              <button onClick={onClose}
                className="mt-5 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                Close
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="mt-3 text-base font-semibold text-gray-900">Error</p>
              <p className="mt-1 text-sm text-red-600">{error}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetForm}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Retry
                </button>
                <button onClick={onClose}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
