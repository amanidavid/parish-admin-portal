'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import WorkspaceService from '@/services/WorkspaceService';
import { Skel, Badge } from '@/components/ui';
import { fmt, fmtCents, fmtDate } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

const STATUS_MAP = {
  active: { label: 'Active', cls: 'badge-green' },
  expired: { label: 'Expired', cls: 'badge-red' },
  unsubscribed: { label: 'Unsubscribed', cls: 'badge-gray' },
};

export default function PropertySubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceUuid = params?.uuid;
  const propertyUuid = params?.propertyUuid;

  const [detail, setDetail] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentMeta, setPaymentMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const { showNotification } = useUiStore();

  const load = useCallback(async (pageNum = 1) => {
    if (!workspaceUuid || !propertyUuid) return;
    setLoading(true);
    try {
      const [dRes, pRes, wRes] = await Promise.allSettled([
        PropertySubscriptionService.show(workspaceUuid, propertyUuid),
        PropertySubscriptionService.propertyPayments(workspaceUuid, propertyUuid, { per_page: 15, page: pageNum }),
        WorkspaceService.show(workspaceUuid),
      ]);

      if (dRes.status === 'fulfilled') {
        setDetail(dRes.value?.data ?? null);
      } else {
        showNotification(dRes.reason?.message || 'Failed to load property details', 'error');
      }

      if (pRes.status === 'fulfilled') {
        setPayments(Array.isArray(pRes.value?.data) ? pRes.value.data : []);
        setPaymentMeta(pRes.value?.meta ?? null);
      }

      if (wRes.status === 'fulfilled') setWorkspace(wRes.value?.data ?? null);
    } catch (e) {
      showNotification(e?.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [workspaceUuid, propertyUuid, showNotification]);

  useEffect(() => { load(page); }, [load, page]);

  const handlePage = useCallback((newPage) => {
    if (!paymentMeta) return;
    const target = Math.max(1, Math.min(paymentMeta.last_page, newPage));
    if (target !== page) setPage(target);
  }, [paymentMeta, page]);

  const summary = detail?.payment_summary;
  const subscription = detail?.subscription;
  const recentHistory = detail?.recent_payment_history || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <button onClick={() => router.back()} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <span className="text-gray-300">|</span>
          <Link href={`/workspaces/${workspaceUuid}`} className="hover:text-gray-800 transition-colors">Workspace</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link href={`/workspaces/${workspaceUuid}/property-subscriptions`} className="hover:text-gray-800 transition-colors">Property Subscriptions</Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 font-medium">Details</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Property Subscription Details</h1>
        <p className="text-sm text-gray-400 mt-0.5">{workspace?.display_name || workspace?.name || 'Workspace'}</p>
      </div>

      {/* Property info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {loading ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 animate-pulse shrink-0" />
            <div className="space-y-1.5"><Skel w="w-40" h="h-3.5" /><Skel w="w-24" h="h-2.5" /></div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
              {(detail?.name || 'P').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{detail?.name || '—'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge map={STATUS_MAP} value={subscription?.effective_status || subscription?.status || 'unsubscribed'} />
                {subscription?.current_period_ends_on && (
                  <span className="text-xs text-gray-400">Until {fmtDate(subscription.current_period_ends_on)}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment summary cards */}
      {!loading && (summary?.active_payment || summary?.latest_payment) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.active_payment && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <p className="text-xs text-green-600 font-medium mb-1">Active Payment</p>
              <p className="text-base font-bold text-gray-900">{fmtCents(summary.active_payment.total_amount_cents, summary.active_payment.currency)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{fmtDate(summary.active_payment.payment_date)}</p>
              <p className="text-xs text-gray-400">Coverage: {fmtDate(summary.active_payment.coverage_starts_on)} – {fmtDate(summary.active_payment.coverage_ends_on)}</p>
            </div>
          )}
          {summary.latest_payment && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
              <p className="text-xs text-orange-600 font-medium mb-1">Latest Payment</p>
              <p className="text-base font-bold text-gray-900">{fmtCents(summary.latest_payment.total_amount_cents, summary.latest_payment.currency)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{fmtDate(summary.latest_payment.payment_date)}</p>
              <p className="text-xs text-gray-400">Coverage: {fmtDate(summary.latest_payment.coverage_starts_on)} – {fmtDate(summary.latest_payment.coverage_ends_on)}</p>
            </div>
          )}
        </div>
      )}

      {/* Summary stats */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500">Total Payments</p>
            <p className="text-xl font-bold text-gray-900">{fmt(summary?.payments_count ?? 0)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500">Total Paid</p>
            <p className="text-xl font-bold text-gray-900">{fmtCents(summary?.total_paid_amount_cents ?? 0)}</p>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Payment History</h3>
          {!loading && (
            <span className="text-xs text-gray-400">{fmt(paymentMeta?.total ?? payments.length)} records</span>
          )}
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skel w="w-24" h="h-3" /><Skel w="w-16" h="h-3" /><Skel w="w-20" h="h-3" /><Skel w="w-20" h="h-3" /><Skel w="w-32" h="h-3" />
              </div>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No payment records found</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Months</th>
                    <th>Monthly Price</th>
                    <th>Total</th>
                    <th>Reference</th>
                    <th>Coverage Period</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.uuid}>
                      <td className="text-sm text-gray-700">{fmtDate(p.payment_date)}</td>
                      <td className="text-center text-sm text-gray-700">{fmt(p.months_paid)}</td>
                      <td className="text-sm text-gray-700">{fmtCents(p.monthly_price_cents)}</td>
                      <td className="text-sm font-medium text-gray-900">{fmtCents(p.total_amount_cents)}</td>
                      <td className="text-xs text-gray-500">{p.reference_number || '—'}</td>
                      <td className="text-xs text-gray-500">{fmtDate(p.coverage_starts_on)} – {fmtDate(p.coverage_ends_on)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paymentMeta?.last_page > 1 && (
              <div className="table-pagination px-5 py-3 border-t border-gray-100">
                <button onClick={() => handlePage(page - 1)} disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Prev
                </button>
                <span className="text-sm text-gray-500">Page {page} of {paymentMeta.last_page}</span>
                <button onClick={() => handlePage(page + 1)} disabled={page >= paymentMeta.last_page}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
