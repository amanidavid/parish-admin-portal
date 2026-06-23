'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useAdminAuthStore from '@/store/adminAuthStore';
import PlatformService from '@/services/PlatformService';
import PropertySubscriptionService from '@/services/PropertySubscriptionService';
import { Skel, Badge } from '@/components/ui';
import { fmt, fmtCents } from '@/lib/formatters';
import { WORKSPACE_STATUS_MAP, PROV_MAP } from '@/constants/status';
import AnalyticsService from '@/services/AnalyticsService';
import { SimpleBarChart, DualAxisChart, StackedBarChart, DonutChart, HorizontalBarChart } from '@/components/charts';
import { PeriodSwitcher } from '@/components/analytics';

// ─── Module-level cache ── persists across client navigations, TTL 30 s ──────
const _cache = { data: null, ts: 0 };
const CACHE_TTL = 30_000;
const REVENUE_EMPTY_SUMMARY = { total_collected_amount_cents: 0 };
const GROWTH_EMPTY_SUMMARY = { new_properties: 0, ending_cumulative_total_properties: 0 };
const STATUS_EMPTY_SUMMARY = { total_properties: 0, active_subscribed_properties: 0, expired_properties: 0, unsubscribed_properties: 0 };
const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];


// Parses bucket_start safely in UTC so the calendar day never shifts
// regardless of the user's local timezone (e.g. UTC+03).
function parseBucketDate(rawDate) {
  const str = String(rawDate).trim().slice(0, 10);
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  return Number.isNaN(date.getTime()) ? null : { date, day: d };
}

function formatUtcDate(date, options) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(date);
}

function formatWeeklyRangeLabel(startDate, endDate) {
  if (!startDate) return 'Unknown';
  if (!endDate) return `Week of ${formatUtcDate(startDate, { day: 'numeric', month: 'short' })}`;

  const sameMonth = startDate.getUTCFullYear() === endDate.getUTCFullYear()
    && startDate.getUTCMonth() === endDate.getUTCMonth();

  if (sameMonth) {
    return `${formatUtcDate(startDate, { day: 'numeric' })}-${formatUtcDate(endDate, { day: 'numeric', month: 'short' })}`;
  }

  return `${formatUtcDate(startDate, { day: 'numeric', month: 'short' })}-${formatUtcDate(endDate, { day: 'numeric', month: 'short' })}`;
}

function formatRevenueLabel(item, bucketBy, period, index) {
  const parsedStart = parseBucketDate(item?.bucket_start || item?.key);
  const parsedEnd = parseBucketDate(item?.bucket_end);
  if (bucketBy === 'week') {
    return `Week ${index + 1}`;
  }

  if (!parsedStart) return item?.label || 'Unknown';
  const { date, day } = parsedStart;
  const fmtOpts = { timeZone: 'UTC' };

  if (period === 'year' || bucketBy === 'month') {
    return new Intl.DateTimeFormat('en-US', { ...fmtOpts, month: 'short' }).format(date);
  }

  if (period === 'week') {
    return new Intl.DateTimeFormat('en-US', { ...fmtOpts, weekday: 'short' }).format(date);
  }

  if (period === 'month') {
    return String(day);
  }

  return new Intl.DateTimeFormat('en-US', { ...fmtOpts, day: 'numeric', month: 'short' }).format(date);
}

function normalizeRevenueSeries(series, filters, period) {
  const bucketBy = filters?.bucket_by || '';

  return Array.isArray(series)
    ? series.map((item, index) => ({
      ...item,
      label: formatRevenueLabel(item, bucketBy, period, index),
    }))
    : [];
}

function formatRevenueRange(filters, period) {
  if (!filters?.start_date || !filters?.end_date) return '';

  const start = parseBucketDate(filters.start_date);
  const end = parseBucketDate(filters.end_date);
  if (!start || !end) return '';

  const fmtOpts = { timeZone: 'UTC' };

  if (period === 'year') {
    return new Intl.DateTimeFormat('en-US', { ...fmtOpts, year: 'numeric' }).format(start.date);
  }

  if (period === 'month') {
    return new Intl.DateTimeFormat('en-US', { ...fmtOpts, month: 'long', year: 'numeric' }).format(start.date);
  }

  const formatter = new Intl.DateTimeFormat('en-GB', { ...fmtOpts, day: '2-digit', month: 'short', year: 'numeric' });
  return `${formatter.format(start.date)} - ${formatter.format(end.date)}`;
}

function formatBucketLabel(bucketBy) {
  if (!bucketBy) return '';
  return `Grouped by ${bucketBy}`;
}

function getYearOptions(currentYear) {
  return Array.from({ length: 6 }, (_, index) => {
    const value = currentYear - index;
    return { value, label: String(value) };
  });
}

function RevenueControlSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={String(value)}
        onChange={onChange}
        aria-label={ariaLabel}
        className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
      >
        {options.map((option) => (
          <option key={option.value} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

// Decorative bar patterns — one per card category (static visual)
const BARS = {
  total: [3, 5, 4, 6, 5, 8, 7, 9, 8, 10],
  active: [4, 6, 5, 7, 8, 7, 9, 8, 10, 9],
  expired: [8, 6, 7, 5, 6, 4, 5, 3, 4, 3],
  unsubscribed: [5, 4, 6, 4, 5, 4, 3, 5, 3, 2],
  properties: [3, 5, 5, 6, 6, 7, 7, 8, 8, 9],
  payments: [4, 6, 6, 8, 7, 9, 8, 9, 10, 9],
};

// ─── Platform Stat Card ───────────────────────────────────────────────────────
function StatCard({ id, label, value, icon, color, bg, loading, href, formatter }) {
  const bars = BARS[id] ?? BARS.total;
  const inner = (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col justify-between min-h-[116px] overflow-hidden relative group transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Top row: icon + mini bar chart */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
          <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
          </svg>
        </div>
        {/* Decorative bars */}
        <div className="flex items-end gap-[2px] h-8 opacity-25 group-hover:opacity-50 transition-opacity shrink-0">
          {bars.map((h, i) => (
            <div key={i} className="w-[5px] rounded-t-[2px]" style={{ height: `${h * 9}%`, backgroundColor: color }} />
          ))}
        </div>
      </div>
      {/* Bottom row: number + label */}
      <div className="mt-3">
        {loading
          ? <Skel w="w-14" h="h-7" />
          : <p className="text-[26px] font-black text-gray-900 leading-none tabular-nums">{formatter ? formatter(value) : fmt(value)}</p>}
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mt-1.5 truncate">{label}</p>
      </div>
      {/* Bottom color accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl opacity-60" style={{ backgroundColor: color }} />
    </div>
  );
  return href
    ? <Link href={href} className="block">{inner}</Link>
    : inner;
}

export default function DashboardPage() {
  const user = useAdminAuthStore((s) => s.user);
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // ── seed from cache immediately — zero flicker on back-navigation ────────
  const cached = _cache.ts && (Date.now() - _cache.ts < CACHE_TTL) ? _cache.data : null;
  const [stats, setStats] = useState(
    cached?.stats ?? {
      total: 0, active: 0, expired: 0, unsubscribed: 0,
      properties: 0, payments: 0, collected: 0,
    }
  );
  const [workspaces, setWorkspaces] = useState(cached?.workspaces ?? []);
  const [loading, setLoading] = useState(!cached);

  // ── Revenue Trend state ──
  const [revenuePeriod, setRevenuePeriod] = useState('month');
  const [revenueSeries, setRevenueSeries] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(REVENUE_EMPTY_SUMMARY);
  const [revenueFilters, setRevenueFilters] = useState(null);
  const [revenueGeneratedAt, setRevenueGeneratedAt] = useState('');
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Per-period independent state
  const [monthState, setMonthState] = useState({ year: currentYear, month: currentMonth });
  const [yearState, setYearState] = useState({ year: currentYear });
  const [customState, setCustomState] = useState({ startDate: '', endDate: '', bucketBy: 'month' });

  const latestRequestRef = useRef(0);

  const yearOptions = useMemo(() => getYearOptions(currentYear), [currentYear]);

  const revenueRequestParams = useMemo(() => {
    if (revenuePeriod === 'week') return { period: 'week' };
    if (revenuePeriod === 'month') {
      return { period: 'month', year: monthState.year, month: monthState.month };
    }
    if (revenuePeriod === 'year') {
      return { period: 'year', year: yearState.year };
    }
    const params = { period: 'custom' };
    if (customState.startDate) params.start_date = customState.startDate;
    if (customState.endDate) params.end_date = customState.endDate;
    if (customState.bucketBy) params.bucket_by = customState.bucketBy;
    return params;
  }, [revenuePeriod, monthState, yearState, customState]);

  const handleRevenuePeriodChange = useCallback((value) => {
    setRevenuePeriod(value);
  }, []);
  const handleMonthYearChange = useCallback((event) => {
    setMonthState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleMonthMonthChange = useCallback((event) => {
    setMonthState((prev) => ({ ...prev, month: Number(event.target.value) }));
  }, []);
  const handleYearYearChange = useCallback((event) => {
    setYearState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleCustomStartChange = useCallback((event) => {
    setCustomState((prev) => ({ ...prev, startDate: event.target.value }));
  }, []);
  const handleCustomEndChange = useCallback((event) => {
    setCustomState((prev) => ({ ...prev, endDate: event.target.value }));
  }, []);
  const handleCustomBucketChange = useCallback((event) => {
    setCustomState((prev) => ({ ...prev, bucketBy: event.target.value }));
  }, []);
  const revenueTooltipFormatter = useCallback((value) => fmtCents(value), []);
  const revenueYAxisTickFormatter = useCallback(
    (value) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0),
    []
  );
  const revenueXAxisLabel = useMemo(() => {
    const bucket = revenueFilters?.bucket_by;
    if (!bucket) return '';
    return bucket.charAt(0).toUpperCase() + bucket.slice(1);
  }, [revenueFilters]);
  const revenueYAxisLabel = 'Amount (TZS)';
  const revenueRangeLabel = useMemo(
    () => formatRevenueRange(revenueFilters, revenuePeriod),
    [revenueFilters, revenuePeriod]
  );
  const revenueBucketLabel = useMemo(
    () => formatBucketLabel(revenueFilters?.bucket_by),
    [revenueFilters]
  );

  // ── Property Growth Trend state ──
  const [growthPeriod, setGrowthPeriod] = useState('month');
  const [growthSeries, setGrowthSeries] = useState([]);
  const [growthSummary, setGrowthSummary] = useState(GROWTH_EMPTY_SUMMARY);
  const [growthFilters, setGrowthFilters] = useState(null);
  const [growthGeneratedAt, setGrowthGeneratedAt] = useState('');
  const [growthLoading, setGrowthLoading] = useState(true);

  const [growthMonthState, setGrowthMonthState] = useState({ year: currentYear, month: currentMonth });
  const [growthYearState, setGrowthYearState] = useState({ year: currentYear });
  const [growthCustomState, setGrowthCustomState] = useState({ startDate: '', endDate: '', bucketBy: 'month' });
  const latestGrowthRequestRef = useRef(0);

  const growthRequestParams = useMemo(() => {
    if (growthPeriod === 'week') return { period: 'week' };
    if (growthPeriod === 'month') {
      return { period: 'month', year: growthMonthState.year, month: growthMonthState.month };
    }
    if (growthPeriod === 'year') {
      return { period: 'year', year: growthYearState.year };
    }
    const params = { period: 'custom' };
    if (growthCustomState.startDate) params.start_date = growthCustomState.startDate;
    if (growthCustomState.endDate) params.end_date = growthCustomState.endDate;
    if (growthCustomState.bucketBy) params.bucket_by = growthCustomState.bucketBy;
    return params;
  }, [growthPeriod, growthMonthState, growthYearState, growthCustomState]);

  const handleGrowthPeriodChange = useCallback((value) => setGrowthPeriod(value), []);
  const handleGrowthMonthYearChange = useCallback((event) => {
    setGrowthMonthState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleGrowthMonthMonthChange = useCallback((event) => {
    setGrowthMonthState((prev) => ({ ...prev, month: Number(event.target.value) }));
  }, []);
  const handleGrowthYearYearChange = useCallback((event) => {
    setGrowthYearState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleGrowthCustomStartChange = useCallback((event) => {
    setGrowthCustomState((prev) => ({ ...prev, startDate: event.target.value }));
  }, []);
  const handleGrowthCustomEndChange = useCallback((event) => {
    setGrowthCustomState((prev) => ({ ...prev, endDate: event.target.value }));
  }, []);
  const handleGrowthCustomBucketChange = useCallback((event) => {
    setGrowthCustomState((prev) => ({ ...prev, bucketBy: event.target.value }));
  }, []);
  const growthXAxisLabel = useMemo(() => {
    const bucket = growthFilters?.bucket_by;
    if (!bucket) return '';
    return bucket.charAt(0).toUpperCase() + bucket.slice(1);
  }, [growthFilters]);
  const growthYAxisLabel = 'New Properties';
  const growthLineAxisLabel = 'Cumulative Total';
  const growthYAxisTickFormatter = useCallback(
    (value) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 0 }).format(value || 0),
    []
  );
  const growthRangeLabel = useMemo(
    () => formatRevenueRange(growthFilters, growthPeriod),
    [growthFilters, growthPeriod]
  );
  const growthBucketLabel = useMemo(
    () => formatBucketLabel(growthFilters?.bucket_by),
    [growthFilters]
  );

  // ── Subscription Status Trend state ──
  const [statusPeriod, setStatusPeriod] = useState('month');
  const [statusSeries, setStatusSeries] = useState([]);
  const [statusSummary, setStatusSummary] = useState(STATUS_EMPTY_SUMMARY);
  const [statusFilters, setStatusFilters] = useState(null);
  const [statusGeneratedAt, setStatusGeneratedAt] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);

  const [statusMonthState, setStatusMonthState] = useState({ year: currentYear, month: currentMonth });
  const [statusYearState, setStatusYearState] = useState({ year: currentYear });
  const [statusCustomState, setStatusCustomState] = useState({ startDate: '', endDate: '', bucketBy: 'month' });
  const latestStatusRequestRef = useRef(0);

  const statusRequestParams = useMemo(() => {
    if (statusPeriod === 'week') return { period: 'week' };
    if (statusPeriod === 'month') {
      return { period: 'month', year: statusMonthState.year, month: statusMonthState.month };
    }
    if (statusPeriod === 'year') {
      return { period: 'year', year: statusYearState.year };
    }
    const params = { period: 'custom' };
    if (statusCustomState.startDate) params.start_date = statusCustomState.startDate;
    if (statusCustomState.endDate) params.end_date = statusCustomState.endDate;
    if (statusCustomState.bucketBy) params.bucket_by = statusCustomState.bucketBy;
    return params;
  }, [statusPeriod, statusMonthState, statusYearState, statusCustomState]);

  const handleStatusPeriodChange = useCallback((value) => setStatusPeriod(value), []);
  const handleStatusMonthYearChange = useCallback((event) => {
    setStatusMonthState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleStatusMonthMonthChange = useCallback((event) => {
    setStatusMonthState((prev) => ({ ...prev, month: Number(event.target.value) }));
  }, []);
  const handleStatusYearYearChange = useCallback((event) => {
    setStatusYearState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleStatusCustomStartChange = useCallback((event) => {
    setStatusCustomState((prev) => ({ ...prev, startDate: event.target.value }));
  }, []);
  const handleStatusCustomEndChange = useCallback((event) => {
    setStatusCustomState((prev) => ({ ...prev, endDate: event.target.value }));
  }, []);
  const handleStatusCustomBucketChange = useCallback((event) => {
    setStatusCustomState((prev) => ({ ...prev, bucketBy: event.target.value }));
  }, []);
  const statusRangeLabel = useMemo(
    () => formatRevenueRange(statusFilters, statusPeriod),
    [statusFilters, statusPeriod]
  );
  const statusBucketLabel = useMemo(
    () => formatBucketLabel(statusFilters?.bucket_by),
    [statusFilters]
  );

  // ── Subscription Status Split state ──
  const [splitSeries, setSplitSeries] = useState([]);
  const [splitSummary, setSplitSummary] = useState(STATUS_EMPTY_SUMMARY);
  const [splitLoading, setSplitLoading] = useState(true);
  const [splitGeneratedAt, setSplitGeneratedAt] = useState('');

  // ── Top Billing Rules state ──
  const [billingPeriod, setBillingPeriod] = useState('month');
  const [billingSeries, setBillingSeries] = useState([]);
  const [billingSummary, setBillingSummary] = useState({ billing_rules_count: 0, total_collected_amount_cents: 0 });
  const [billingFilters, setBillingFilters] = useState(null);
  const [billingGeneratedAt, setBillingGeneratedAt] = useState('');
  const [billingLoading, setBillingLoading] = useState(true);

  const [billingMonthState, setBillingMonthState] = useState({ year: currentYear, month: currentMonth });
  const [billingYearState, setBillingYearState] = useState({ year: currentYear });
  const [billingCustomState, setBillingCustomState] = useState({ startDate: '', endDate: '', bucketBy: 'month' });
  const latestBillingRequestRef = useRef(0);

  const billingRequestParams = useMemo(() => {
    if (billingPeriod === 'week') return { period: 'week' };
    if (billingPeriod === 'month') {
      return { period: 'month', year: billingMonthState.year, month: billingMonthState.month };
    }
    if (billingPeriod === 'year') {
      return { period: 'year', year: billingYearState.year };
    }
    const params = { period: 'custom' };
    if (billingCustomState.startDate) params.start_date = billingCustomState.startDate;
    if (billingCustomState.endDate) params.end_date = billingCustomState.endDate;
    if (billingCustomState.bucketBy) params.bucket_by = billingCustomState.bucketBy;
    return params;
  }, [billingPeriod, billingMonthState, billingYearState, billingCustomState]);

  const handleBillingPeriodChange = useCallback((value) => setBillingPeriod(value), []);
  const handleBillingMonthYearChange = useCallback((event) => {
    setBillingMonthState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleBillingMonthMonthChange = useCallback((event) => {
    setBillingMonthState((prev) => ({ ...prev, month: Number(event.target.value) }));
  }, []);
  const handleBillingYearYearChange = useCallback((event) => {
    setBillingYearState((prev) => ({ ...prev, year: Number(event.target.value) }));
  }, []);
  const handleBillingCustomStartChange = useCallback((event) => {
    setBillingCustomState((prev) => ({ ...prev, startDate: event.target.value }));
  }, []);
  const handleBillingCustomEndChange = useCallback((event) => {
    setBillingCustomState((prev) => ({ ...prev, endDate: event.target.value }));
  }, []);
  const handleBillingCustomBucketChange = useCallback((event) => {
    setBillingCustomState((prev) => ({ ...prev, bucketBy: event.target.value }));
  }, []);
  const billingRangeLabel = useMemo(
    () => formatRevenueRange(billingFilters, billingPeriod),
    [billingFilters, billingPeriod]
  );
  const billingBucketLabel = useMemo(
    () => formatBucketLabel(billingFilters?.bucket_by),
    [billingFilters]
  );
  const billingTooltipFormatter = useCallback((value, name) => {
    if (name === 'total_collected_amount_cents') return [fmtCents(value), 'Revenue'];
    return [value, name];
  }, []);
  const billingXTickFormatter = useCallback(
    (value) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value || 0),
    []
  );

  // ── Fetch revenue trend ──
  useEffect(() => {
    setRevenueLoading(true);
    setRevenueFilters(null);
    setRevenueGeneratedAt('');

    if (revenuePeriod === 'custom' && (!revenueRequestParams.start_date || !revenueRequestParams.end_date)) {
      setRevenueSeries([]);
      setRevenueSummary(REVENUE_EMPTY_SUMMARY);
      setRevenueLoading(false);
      return;
    }

    const requestId = ++latestRequestRef.current;

    AnalyticsService.revenueTrend(revenueRequestParams).then((res) => {
      if (requestId !== latestRequestRef.current) return;

      const payload = res?.data ?? null;

      if (payload) {
        const filters = payload.filters || null;
        setRevenueSeries(normalizeRevenueSeries(payload.series, filters, revenuePeriod));
        setRevenueSummary(payload.summary || REVENUE_EMPTY_SUMMARY);
        setRevenueFilters(filters);
        setRevenueGeneratedAt(payload.generated_at || '');
      } else {
        setRevenueSeries([]);
        setRevenueSummary(REVENUE_EMPTY_SUMMARY);
        setRevenueFilters(null);
        setRevenueGeneratedAt('');
      }
      setRevenueLoading(false);
    });
  }, [revenuePeriod, revenueRequestParams]);

  // ── Fetch property growth trend ──
  useEffect(() => {
    setGrowthLoading(true);
    setGrowthFilters(null);
    setGrowthGeneratedAt('');

    if (growthPeriod === 'custom' && (!growthRequestParams.start_date || !growthRequestParams.end_date)) {
      setGrowthSeries([]);
      setGrowthSummary(GROWTH_EMPTY_SUMMARY);
      setGrowthLoading(false);
      return;
    }

    const requestId = ++latestGrowthRequestRef.current;

    AnalyticsService.propertyGrowthTrend(growthRequestParams).then((res) => {
      if (requestId !== latestGrowthRequestRef.current) return;

      const payload = res?.data ?? null;

      if (payload) {
        const filters = payload.filters || null;
        const bucketBy = filters?.bucket_by || '';
        const formattedSeries = Array.isArray(payload.series)
          ? payload.series.map((item, index) => ({
            ...item,
            label: formatRevenueLabel(item, bucketBy, growthPeriod, index),
          }))
          : [];
        setGrowthSeries(formattedSeries);
        setGrowthSummary(payload.summary || GROWTH_EMPTY_SUMMARY);
        setGrowthFilters(filters);
        setGrowthGeneratedAt(payload.generated_at || '');
      } else {
        setGrowthSeries([]);
        setGrowthSummary(GROWTH_EMPTY_SUMMARY);
        setGrowthFilters(null);
        setGrowthGeneratedAt('');
      }
      setGrowthLoading(false);
    });
  }, [growthPeriod, growthRequestParams]);

  // ── Fetch subscription status trend ──
  useEffect(() => {
    setStatusLoading(true);
    setStatusFilters(null);
    setStatusGeneratedAt('');

    if (statusPeriod === 'custom' && (!statusRequestParams.start_date || !statusRequestParams.end_date)) {
      setStatusSeries([]);
      setStatusSummary(STATUS_EMPTY_SUMMARY);
      setStatusLoading(false);
      return;
    }

    const requestId = ++latestStatusRequestRef.current;

    AnalyticsService.subscriptionStatusTrend(statusRequestParams).then((res) => {
      if (requestId !== latestStatusRequestRef.current) return;

      const payload = res?.data ?? null;

      if (payload) {
        const filters = payload.filters || null;
        const bucketBy = filters?.bucket_by || '';
        const formattedSeries = Array.isArray(payload.series)
          ? payload.series.map((item, index) => ({
            ...item,
            label: formatRevenueLabel(item, bucketBy, statusPeriod, index),
          }))
          : [];
        setStatusSeries(formattedSeries);
        setStatusSummary(payload.summary || STATUS_EMPTY_SUMMARY);
        setStatusFilters(filters);
        setStatusGeneratedAt(payload.generated_at || '');
      } else {
        setStatusSeries([]);
        setStatusSummary(STATUS_EMPTY_SUMMARY);
        setStatusFilters(null);
        setStatusGeneratedAt('');
      }
      setStatusLoading(false);
    });
  }, [statusPeriod, statusRequestParams]);

  // ── Fetch subscription status split (snapshot) ──
  useEffect(() => {
    setSplitLoading(true);
    AnalyticsService.subscriptionStatusSplit().then((res) => {
      const payload = res?.data ?? null;
      if (payload) {
        setSplitSeries(payload.series || []);
        setSplitSummary(payload.summary || STATUS_EMPTY_SUMMARY);
        setSplitGeneratedAt(payload.generated_at || '');
      } else {
        setSplitSeries([]);
        setSplitSummary(STATUS_EMPTY_SUMMARY);
        setSplitGeneratedAt('');
      }
      setSplitLoading(false);
    });
  }, []);

  // ── Fetch top billing rules ──
  useEffect(() => {
    setBillingLoading(true);
    setBillingFilters(null);
    setBillingGeneratedAt('');

    if (billingPeriod === 'custom' && (!billingRequestParams.start_date || !billingRequestParams.end_date)) {
      setBillingSeries([]);
      setBillingSummary({ billing_rules_count: 0, total_collected_amount_cents: 0 });
      setBillingLoading(false);
      return;
    }

    const requestId = ++latestBillingRequestRef.current;

    AnalyticsService.topBillingRules(billingRequestParams).then((res) => {
      if (requestId !== latestBillingRequestRef.current) return;

      const payload = res?.data ?? null;

      if (payload) {
        setBillingSeries(payload.series || []);
        setBillingSummary(payload.summary || { billing_rules_count: 0, total_collected_amount_cents: 0 });
        setBillingFilters(payload.filters || null);
        setBillingGeneratedAt(payload.generated_at || '');
      } else {
        setBillingSeries([]);
        setBillingSummary({ billing_rules_count: 0, total_collected_amount_cents: 0 });
        setBillingFilters(null);
        setBillingGeneratedAt('');
      }
      setBillingLoading(false);
    });
  }, [billingPeriod, billingRequestParams]);

  useEffect(() => {
    if (cached) return;
    Promise.allSettled([
      PlatformService.overview(),
      PropertySubscriptionService.byWorkspaceReport({ per_page: 1 }),
    ]).then(([oRes, rRes]) => {
      let newStats = { total: 0, active: 0, expired: 0, unsubscribed: 0, properties: 0, payments: 0, collected: 0 };
      let newWorkspaces = [];

      if (oRes.status === 'fulfilled' && oRes.value?.success) {
        const d = oRes.value.data;
        newStats.total = d.summary?.total_workspaces ?? 0;
        newWorkspaces = d.recent_workspaces ?? [];
      }

      if (rRes.status === 'fulfilled' && rRes.value?.data?.totals) {
        const t = rRes.value.data.totals;
        newStats.active = t.active_subscribed_properties ?? 0;
        newStats.expired = t.expired_properties ?? 0;
        newStats.unsubscribed = t.unsubscribed_properties ?? 0;
        newStats.properties = t.total_properties ?? 0;
        newStats.payments = t.payments_count ?? 0;
        newStats.collected = t.total_collected_amount_cents ?? 0;
      }

      _cache.data = { stats: newStats, workspaces: newWorkspaces };
      _cache.ts = Date.now();
      setStats(newStats);
      setWorkspaces(newWorkspaces);
      setLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = useMemo(
    () => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(now),
    [now]
  );


  return (
    <div className="space-y-7">
      {/* ── Welcome Banner ── */}
      <div className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg,#ea580c 0%,#f97316 60%,#fb923c 100%)' }}>
        <div className="absolute right-0 top-0 w-64 h-64 opacity-[0.07] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#fff 0%,transparent 70%)', transform: 'translate(30%,-30%)' }} />
        <div>
          <p className="text-orange-100 text-sm font-medium mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0] || user?.username || 'Admin'}
          </h1>
          <p className="text-orange-100 text-sm mt-1">
            {loading ? '…' : fmt(stats.total)} workspaces · {loading ? '…' : fmt(stats.properties)} properties
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          <Link href="/workspaces"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-primary-700 text-sm font-semibold hover:bg-orange-50 transition-colors shadow-sm">
            Workspaces
          </Link>
          <Link href="/billing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors">
            Billing
          </Link>
        </div>
      </div>

      {/* ── Platform Stats ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Platform Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard id="total" label="Workspaces" value={stats.total} loading={loading} href="/workspaces"
            icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
            color="#ea580c" bg="#fff7ed" />
          <StatCard id="properties" label="Properties" value={stats.properties} loading={loading} href="/reports/property-subscriptions/by-workspace"
            icon="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            color="#2563eb" bg="#dbeafe" />
          <StatCard id="active" label="Active Subscribed" value={stats.active} loading={loading} href="/reports/property-subscriptions/by-workspace"
            icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            color="#16a34a" bg="#f0fdf4" />
          <StatCard id="expired" label="Expired" value={stats.expired} loading={loading} href="/reports/property-subscriptions/by-workspace"
            icon="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            color="#dc2626" bg="#fef2f2" />
          <StatCard id="unsubscribed" label="Unsubscribed" value={stats.unsubscribed} loading={loading} href="/reports/property-subscriptions/by-workspace"
            icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            color="#6b7280" bg="#f3f4f6" />
          <StatCard id="payments" label="Payments Collected" value={stats.collected} formatter={(c) => new Intl.NumberFormat('en-US').format(c || 0)} loading={loading} href="/reports/property-subscriptions/by-workspace"
            icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            color="#9333ea" bg="#f5f3ff" />
        </div>
      </div>

      {/* ── Analytics Charts Grid ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Analytics</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue Trend */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Revenue Trend</h3>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {revenueGeneratedAt && (
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {new Date(revenueGeneratedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                )}
                {revenuePeriod === 'month' && (
                  <>
                    <RevenueControlSelect
                      value={monthState.month}
                      onChange={handleMonthMonthChange}
                      options={MONTH_OPTIONS}
                      ariaLabel="Select revenue month"
                    />
                    <RevenueControlSelect
                      value={monthState.year}
                      onChange={handleMonthYearChange}
                      options={yearOptions}
                      ariaLabel="Select revenue year"
                    />
                  </>
                )}
                {revenuePeriod === 'year' && (
                  <RevenueControlSelect
                    value={yearState.year}
                    onChange={handleYearYearChange}
                    options={yearOptions}
                    ariaLabel="Select revenue year"
                  />
                )}
                <PeriodSwitcher value={revenuePeriod} onChange={handleRevenuePeriodChange} />
              </div>
            </div>

            {revenuePeriod === 'custom' && (
              <div className="flex gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">From</label>
                  <input
                    type="date"
                    value={customState.startDate}
                    onChange={handleCustomStartChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">To</label>
                  <input
                    type="date"
                    value={customState.endDate}
                    onChange={handleCustomEndChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">Bucket</label>
                  <RevenueControlSelect
                    value={customState.bucketBy}
                    onChange={handleCustomBucketChange}
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                    ]}
                    ariaLabel="Select custom revenue bucket"
                  />
                </div>
              </div>
            )}

            {(revenueRangeLabel || revenueBucketLabel) && (
              <p className="text-[11px] text-gray-500 mb-2">
                {[revenueRangeLabel, revenueBucketLabel].filter(Boolean).join(' • ')}
              </p>
            )}

            <SimpleBarChart
              data={revenueSeries}
              dataKey="total_collected_amount_cents"
              xKey="label"
              color="#ea580c"
              loading={revenueLoading}
              tooltipFormatter={revenueTooltipFormatter}
              yTickFormatter={revenueYAxisTickFormatter}
              xAxisLabel={revenueXAxisLabel}
              yAxisLabel={revenueYAxisLabel}
              emptyText="No revenue data for selected period"
            />

            {!revenueLoading && revenueSeries.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-right">
                Total <span className="font-semibold text-gray-800">{fmtCents(revenueSummary.total_collected_amount_cents)}</span>
              </p>
            )}
          </div>

          {/* Property Growth Trend */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Property Growth</h3>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {growthGeneratedAt && (
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {new Date(growthGeneratedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                )}
                {growthPeriod === 'month' && (
                  <>
                    <RevenueControlSelect
                      value={growthMonthState.month}
                      onChange={handleGrowthMonthMonthChange}
                      options={MONTH_OPTIONS}
                      ariaLabel="Select growth month"
                    />
                    <RevenueControlSelect
                      value={growthMonthState.year}
                      onChange={handleGrowthMonthYearChange}
                      options={yearOptions}
                      ariaLabel="Select growth year"
                    />
                  </>
                )}
                {growthPeriod === 'year' && (
                  <RevenueControlSelect
                    value={growthYearState.year}
                    onChange={handleGrowthYearYearChange}
                    options={yearOptions}
                    ariaLabel="Select growth year"
                  />
                )}
                <PeriodSwitcher value={growthPeriod} onChange={handleGrowthPeriodChange} />
              </div>
            </div>

            {growthPeriod === 'custom' && (
              <div className="flex gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">From</label>
                  <input
                    type="date"
                    value={growthCustomState.startDate}
                    onChange={handleGrowthCustomStartChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">To</label>
                  <input
                    type="date"
                    value={growthCustomState.endDate}
                    onChange={handleGrowthCustomEndChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">Bucket</label>
                  <RevenueControlSelect
                    value={growthCustomState.bucketBy}
                    onChange={handleGrowthCustomBucketChange}
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                    ]}
                    ariaLabel="Select custom growth bucket"
                  />
                </div>
              </div>
            )}

            {(growthRangeLabel || growthBucketLabel) && (
              <p className="text-[11px] text-gray-500 mb-2">
                {[growthRangeLabel, growthBucketLabel].filter(Boolean).join(' • ')}
              </p>
            )}

            <DualAxisChart
              data={growthSeries}
              barKey="new_properties"
              lineKey="cumulative_total_properties"
              xKey="label"
              barColor="#2563eb"
              lineColor="#16a34a"
              loading={growthLoading}
              tooltipFormatter={(value, name) => [fmt(value || 0), name === 'new_properties' ? 'New' : 'Cumulative']}
              yTickFormatter={growthYAxisTickFormatter}
              lineTickFormatter={growthYAxisTickFormatter}
              xAxisLabel={growthXAxisLabel}
              yAxisLabel={growthYAxisLabel}
              lineAxisLabel={growthLineAxisLabel}
              emptyText="No property growth data for selected period"
            />

            {!growthLoading && growthSeries.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-right">
                <span className="font-semibold text-gray-800">{fmt(growthSummary.new_properties || 0)}</span> new ·{' '}
                <span className="font-semibold text-gray-800">{fmt(growthSummary.ending_cumulative_total_properties || 0)}</span> total
              </p>
            )}
          </div>

          {/* Subscription Status Trend */}
          <div className="lg:col-span-2 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Subscription Status Trend</h3>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {statusGeneratedAt && (
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {new Date(statusGeneratedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                )}
                {statusPeriod === 'month' && (
                  <>
                    <RevenueControlSelect
                      value={statusMonthState.month}
                      onChange={handleStatusMonthMonthChange}
                      options={MONTH_OPTIONS}
                      ariaLabel="Select status month"
                    />
                    <RevenueControlSelect
                      value={statusMonthState.year}
                      onChange={handleStatusMonthYearChange}
                      options={yearOptions}
                      ariaLabel="Select status year"
                    />
                  </>
                )}
                {statusPeriod === 'year' && (
                  <RevenueControlSelect
                    value={statusYearState.year}
                    onChange={handleStatusYearYearChange}
                    options={yearOptions}
                    ariaLabel="Select status year"
                  />
                )}
                <PeriodSwitcher value={statusPeriod} onChange={handleStatusPeriodChange} />
              </div>
            </div>

            {statusPeriod === 'custom' && (
              <div className="flex gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">From</label>
                  <input
                    type="date"
                    value={statusCustomState.startDate}
                    onChange={handleStatusCustomStartChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">To</label>
                  <input
                    type="date"
                    value={statusCustomState.endDate}
                    onChange={handleStatusCustomEndChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">Bucket</label>
                  <RevenueControlSelect
                    value={statusCustomState.bucketBy}
                    onChange={handleStatusCustomBucketChange}
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                    ]}
                    ariaLabel="Select custom status bucket"
                  />
                </div>
              </div>
            )}

            {(statusRangeLabel || statusBucketLabel) && (
              <p className="text-[11px] text-gray-500 mb-2">
                {[statusRangeLabel, statusBucketLabel].filter(Boolean).join(' • ')}
              </p>
            )}

            <StackedBarChart
              data={statusSeries}
              loading={statusLoading}
              keys={['active_subscribed_properties', 'expired_properties', 'unsubscribed_properties']}
            />

            {!statusLoading && statusSeries.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-right">
                <span className="font-semibold text-green-600">{fmt(statusSummary.active_subscribed_properties || 0)}</span> active ·{' '}
                <span className="font-semibold text-red-600">{fmt(statusSummary.expired_properties || 0)}</span> expired ·{' '}
                <span className="font-semibold text-gray-600">{fmt(statusSummary.unsubscribed_properties || 0)}</span> unsubscribed
              </p>
            )}
          </div>

          {/* Subscription Status Split */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Subscription Status Split</h3>
              {splitGeneratedAt && (
                <span className="text-[10px] text-gray-400 hidden sm:inline">
                  {new Date(splitGeneratedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              )}
            </div>

            {/* Spacer to align chart top with billing rules label row */}
            <p className="text-[11px] text-gray-500 mb-2 invisible">&nbsp;</p>

            <DonutChart
              data={splitSeries}
              loading={splitLoading}
              innerLabel="Total"
              innerValue={splitSummary.total_properties}
            />

            {!splitLoading && splitSeries.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-right">
                <span className="font-semibold text-green-600">{fmt(splitSummary.active_subscribed_properties || 0)}</span> active ·{' '}
                <span className="font-semibold text-red-600">{fmt(splitSummary.expired_properties || 0)}</span> expired ·{' '}
                <span className="font-semibold text-gray-600">{fmt(splitSummary.unsubscribed_properties || 0)}</span> unsubscribed
              </p>
            )}
          </div>

          {/* Top Billing Rules */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-800">Top Billing Rules</h3>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {billingGeneratedAt && (
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    {new Date(billingGeneratedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
                  </span>
                )}
                {billingPeriod === 'month' && (
                  <>
                    <RevenueControlSelect
                      value={billingMonthState.month}
                      onChange={handleBillingMonthMonthChange}
                      options={MONTH_OPTIONS}
                      ariaLabel="Select billing month"
                    />
                    <RevenueControlSelect
                      value={billingMonthState.year}
                      onChange={handleBillingMonthYearChange}
                      options={yearOptions}
                      ariaLabel="Select billing year"
                    />
                  </>
                )}
                {billingPeriod === 'year' && (
                  <RevenueControlSelect
                    value={billingYearState.year}
                    onChange={handleBillingYearYearChange}
                    options={yearOptions}
                    ariaLabel="Select billing year"
                  />
                )}
                <PeriodSwitcher value={billingPeriod} onChange={handleBillingPeriodChange} />
              </div>
            </div>

            {billingPeriod === 'custom' && (
              <div className="flex gap-3 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">From</label>
                  <input
                    type="date"
                    value={billingCustomState.startDate}
                    onChange={handleBillingCustomStartChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">To</label>
                  <input
                    type="date"
                    value={billingCustomState.endDate}
                    onChange={handleBillingCustomEndChange}
                    className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] text-gray-500 font-medium">Bucket</label>
                  <RevenueControlSelect
                    value={billingCustomState.bucketBy}
                    onChange={handleBillingCustomBucketChange}
                    options={[
                      { value: 'day', label: 'Day' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                    ]}
                    ariaLabel="Select custom billing bucket"
                  />
                </div>
              </div>
            )}

            {(billingRangeLabel || billingBucketLabel) && (
              <p className="text-[11px] text-gray-500 mb-2">
                {[billingRangeLabel, billingBucketLabel].filter(Boolean).join(' • ')}
              </p>
            )}

            <HorizontalBarChart
              data={billingSeries}
              xKey="total_collected_amount_cents"
              yKey="label"
              color="#ea580c"
              loading={billingLoading}
              tooltipFormatter={billingTooltipFormatter}
              xTickFormatter={billingXTickFormatter}
              emptyText="No billing rules data for selected period"
            />

            {!billingLoading && billingSeries.length > 0 && (
              <p className="text-[11px] text-gray-500 mt-1.5 text-right">
                <span className="font-semibold text-gray-800">{billingSummary.billing_rules_count || 0}</span> rules ·{' '}
                <span className="font-semibold text-gray-800">{fmtCents(billingSummary.total_collected_amount_cents || 0)}</span> total
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent Workspaces Table ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Recent Workspaces</h2>
            <p className="text-xs text-gray-400 mt-0.5">10 most recently registered accounts</p>
          </div>
          <Link href="/workspaces"
            className="inline-flex items-center gap-1 text-sm text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            View all
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Status</th>
                <th>Provisioning</th>
                <th>Database</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse shrink-0" />
                      <div className="space-y-1.5">
                        <Skel w="w-32" h="h-3" />
                        <Skel w="w-20" h="h-2.5" />
                      </div>
                    </div>
                  </td>
                  <td><Skel w="w-14" h="h-5" /></td>
                  <td><Skel w="w-20" h="h-5" /></td>
                  <td><Skel w="w-28" h="h-3" /></td>
                  <td></td>
                </tr>
              ))}
              {!loading && workspaces.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No workspaces yet</td>
                </tr>
              )}
              {!loading && workspaces.map((t) => (
                <tr key={t.uuid}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                        {(t.display_name || t.name || 'W').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{t.display_name || t.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{t.name}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge map={WORKSPACE_STATUS_MAP} value={t.status} />
                  </td>
                  <td>
                    <Badge map={PROV_MAP} value={t.provisioning_status} />
                  </td>
                  <td className="text-xs text-gray-400 font-mono">{t.database || '—'}</td>
                  <td>
                    <Link href={`/workspaces/${t.uuid}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
