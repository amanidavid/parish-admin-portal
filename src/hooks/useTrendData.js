'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const EMPTY_SUMMARY = { total_collected_amount_cents: 0 };

/**
 * Generic hook for analytics trend data with per-period independent filters.
 *
 * @param {Object} options
 * @param {Function} options.fetcher - API service method, receives params object
 * @param {Function} options.normalize - (series, filters, period) => formatted series
 * @param {string} [options.initialPeriod='month'] - Starting period
 * @param {number} [options.currentYear] - Current year for defaults
 * @param {number} [options.currentMonth] - Current month for defaults
 * @param {Object} [options.staticParams={}] - Params merged into every request (e.g. include_cumulative)
 */
export default function useTrendData({
  fetcher,
  normalize,
  initialPeriod = 'month',
  currentYear,
  currentMonth,
  staticParams = {},
}) {
  const [period, setPeriod] = useState(initialPeriod);
  const [series, setSeries] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [filters, setFilters] = useState(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);

  // Per-period independent state
  const [monthState, setMonthState] = useState({
    year: currentYear,
    month: currentMonth,
  });
  const [yearState, setYearState] = useState({ year: currentYear });
  const [customState, setCustomState] = useState({
    startDate: '',
    endDate: '',
    bucketBy: 'month',
  });

  const latestRequestRef = useRef(0);

  // Stabilize staticParams so inline object literals in parent don't trigger re-fetch loops
  const staticParamsKey = useMemo(() => JSON.stringify(staticParams), [staticParams]);

  const requestParams = useMemo(() => {
    const sp = JSON.parse(staticParamsKey);
    if (period === 'week') return { ...sp, period: 'week' };
    if (period === 'month') {
      return {
        ...sp,
        period: 'month',
        year: monthState.year,
        month: monthState.month,
      };
    }
    if (period === 'year') {
      return {
        ...sp,
        period: 'year',
        year: yearState.year,
      };
    }
    const params = { ...sp, period: 'custom' };
    if (customState.startDate) params.start_date = customState.startDate;
    if (customState.endDate) params.end_date = customState.endDate;
    if (customState.bucketBy) params.bucket_by = customState.bucketBy;
    return params;
  }, [period, monthState, yearState, customState, staticParamsKey]);

  // Fetch data when params change
  useEffect(() => {
    setLoading(true);
    setFilters(null);
    setGeneratedAt('');

    if (period === 'custom' && (!requestParams.start_date || !requestParams.end_date)) {
      setSeries([]);
      setSummary(EMPTY_SUMMARY);
      setLoading(false);
      return;
    }

    const requestId = ++latestRequestRef.current;

    fetcher(requestParams)
      .then((res) => {
        if (requestId !== latestRequestRef.current) return;

        const payload = res?.data ?? null;
        if (payload) {
          const f = payload.filters || null;
          setSeries(normalize ? normalize(payload.series, f, period) : (payload.series || []));
          setSummary(payload.summary || EMPTY_SUMMARY);
          setFilters(f);
          setGeneratedAt(payload.generated_at || '');
        } else {
          setSeries([]);
          setSummary(EMPTY_SUMMARY);
          setFilters(null);
          setGeneratedAt('');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (requestId !== latestRequestRef.current) return;
        // eslint-disable-next-line no-console
        console.error('[useTrendData] fetch error:', err);
        setSeries([]);
        setSummary(EMPTY_SUMMARY);
        setFilters(null);
        setGeneratedAt('');
        setLoading(false);
      });
  }, [period, requestParams, fetcher, normalize]);

  // Handlers
  const handlePeriodChange = useCallback((value) => setPeriod(value), []);
  const handleMonthYearChange = useCallback((e) => {
    setMonthState((p) => ({ ...p, year: Number(e.target.value) }));
  }, []);
  const handleMonthMonthChange = useCallback((e) => {
    setMonthState((p) => ({ ...p, month: Number(e.target.value) }));
  }, []);
  const handleYearYearChange = useCallback((e) => {
    setYearState((p) => ({ ...p, year: Number(e.target.value) }));
  }, []);
  const handleCustomStartChange = useCallback((e) => {
    setCustomState((p) => ({ ...p, startDate: e.target.value }));
  }, []);
  const handleCustomEndChange = useCallback((e) => {
    setCustomState((p) => ({ ...p, endDate: e.target.value }));
  }, []);
  const handleCustomBucketChange = useCallback((e) => {
    setCustomState((p) => ({ ...p, bucketBy: e.target.value }));
  }, []);

  return {
    period,
    series,
    summary,
    filters,
    generatedAt,
    loading,
    requestParams,
    monthState,
    yearState,
    customState,
    handlePeriodChange,
    handleMonthYearChange,
    handleMonthMonthChange,
    handleYearYearChange,
    handleCustomStartChange,
    handleCustomEndChange,
    handleCustomBucketChange,
  };
}
