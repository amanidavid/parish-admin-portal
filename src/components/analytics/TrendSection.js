'use client';
import { memo } from 'react';
import { PeriodSwitcher } from '.';

function ControlSelect({ value, onChange, options, ariaLabel }) {
  return (
    <div className="relative">
      <select
        value={String(value)}
        onChange={onChange}
        aria-label={ariaLabel}
        className="appearance-none bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

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

const BUCKET_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function formatGeneratedAt(value) {
  if (!value) return '';

  const normalized = String(value).includes('T')
    ? String(value)
    : String(value).replace(' ', 'T');
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function TrendSection({
  title,
  generatedAt,
  period,
  onPeriodChange,
  monthState,
  yearState,
  customState,
  onMonthMonthChange,
  onMonthYearChange,
  onYearYearChange,
  onCustomStartChange,
  onCustomEndChange,
  onCustomBucketChange,
  yearOptions,
  rangeLabel,
  bucketLabel,
  children,
  summaryFooter,
}) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {generatedAt && (
            <span className="text-[10px] text-gray-400 hidden sm:inline">
              {formatGeneratedAt(generatedAt)}
            </span>
          )}
          {period === 'month' && (
            <>
              <ControlSelect
                value={monthState.month}
                onChange={onMonthMonthChange}
                options={MONTH_OPTIONS}
                ariaLabel="Select month"
              />
              <ControlSelect
                value={monthState.year}
                onChange={onMonthYearChange}
                options={yearOptions}
                ariaLabel="Select year"
              />
            </>
          )}
          {period === 'year' && (
            <ControlSelect
              value={yearState.year}
              onChange={onYearYearChange}
              options={yearOptions}
              ariaLabel="Select year"
            />
          )}
          <PeriodSwitcher value={period} onChange={onPeriodChange} />
        </div>
      </div>

      {/* Custom date inputs */}
      {period === 'custom' && (
        <div className="flex gap-3 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">From</label>
            <input
              type="date"
              value={customState.startDate}
              onChange={onCustomStartChange}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">To</label>
            <input
              type="date"
              value={customState.endDate}
              onChange={onCustomEndChange}
              className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-gray-500 font-medium">Bucket</label>
            <ControlSelect
              value={customState.bucketBy}
              onChange={onCustomBucketChange}
              options={BUCKET_OPTIONS}
              ariaLabel="Select custom bucket"
            />
          </div>
        </div>
      )}

      {/* Range / bucket subtitle */}
      {(rangeLabel || bucketLabel) && (
        <p className="text-[11px] text-gray-500 mb-2">
          {[rangeLabel, bucketLabel].filter(Boolean).join(' • ')}
        </p>
      )}

      {/* Chart */}
      {children}

      {/* Summary footer */}
      {summaryFooter}
    </div>
  );
}

export default memo(TrendSection);
