'use client';
import { useEffect, useState, useCallback } from 'react';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import { Skel, StatCard } from '@/components/ui';
import { fmt, fmtCents, fmtDateTime } from '@/lib/formatters';
import useUiStore from '@/store/uiStore';

export default function PaymentSummaryPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useUiStore();

  useEffect(() => {
    (async () => {
      try {
        const res = await PropertySubscriptionService.paymentSummaryReport();
        if (res?.data) setSummary(res.data);
      } catch (e) {
        showNotification(e?.message || 'Failed to load summary', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showNotification]);

  const data = summary;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Payment Summary</h1>
        <p className="text-sm text-gray-400 mt-0.5">Overview of property subscription payments across all workspaces</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <Skel w="w-20" h="h-3" /><Skel w="w-16" h="h-8" className="mt-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Payments" value={fmt(data?.total_payments)} icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" color="#0891b2" bg="#cffafe" />
            <StatCard label="Total Amount" value={fmtCents(data?.total_amount_cents)} icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#9333ea" bg="#f3e8ff" />
            <StatCard label="Active Properties" value={fmt(data?.active_properties_count)} icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" color="#16a34a" bg="#dcfce7" />
            <StatCard label="Expired Properties" value={fmt(data?.expired_properties_count)} icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" color="#dc2626" bg="#fee2e2" />
          </div>

          {data?.breakdown && (
            <div className="data-table-wrap">
              <div className="overflow-x-auto">
                <table className="data-table min-w-[600px]">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th className="text-center">Payments</th>
                      <th>Amount</th>
                      <th>Avg Amount</th>
                      <th>Created</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((row) => (
                      <tr key={row.period}>
                        <td className="font-semibold text-sm text-gray-900">{row.period}</td>
                        <td className="text-center text-sm text-gray-700">{fmt(row.payments_count)}</td>
                        <td className="text-sm font-medium text-gray-900">{fmtCents(row.total_amount_cents)}</td>
                        <td className="text-sm text-gray-700">{fmtCents(row.average_amount_cents)}</td>
                        <td className="text-xs text-gray-500">{fmtDateTime(row.created_at ?? row.createdAt)}</td>
                        <td className="text-xs text-gray-500">{fmtDateTime(row.updated_at ?? row.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
