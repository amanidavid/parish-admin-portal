'use client';
import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label, Line, LineChart, ComposedChart,
} from 'recharts';

const DEFAULT_BAR_COLOR = '#2563eb';
const DEFAULT_LINE_COLOR = '#16a34a';

function getTooltipPayload(value, name, tooltipFormatter) {
  if (!tooltipFormatter) return [value, name];

  const formatted = tooltipFormatter(value, name);
  if (Array.isArray(formatted)) {
    return formatted;
  }

  return [formatted, name];
}

function DualAxisChart({
  data,
  barKey,
  lineKey,
  xKey,
  barColor,
  lineColor,
  loading,
  tooltipFormatter,
  yTickFormatter,
  lineTickFormatter,
  xAxisLabel,
  yAxisLabel,
  lineAxisLabel,
  emptyText = 'No data available',
}) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 h-[300px] flex items-center justify-center">
        <div className="animate-pulse bg-gray-100 rounded-lg w-full h-48" />
      </div>
    );
  }

  const series = data || [];
  if (series.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 h-[300px] flex items-center justify-center">
        <p className="text-sm text-gray-400">{emptyText}</p>
      </div>
    );
  }

  const bColor = barColor || DEFAULT_BAR_COLOR;
  const lColor = lineColor || DEFAULT_LINE_COLOR;
  const hasLine = series.some((d) => d[lineKey] != null);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={series} margin={{ top: 5, right: 15, left: 15, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          >
            {xAxisLabel && <Label value={xAxisLabel} position="insideBottom" offset={-2} style={{ fontSize: 11, fill: '#9ca3af' }} />}
          </XAxis>
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yTickFormatter}
            width={60}
            domain={[0, 'auto']}
          >
            {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="left" offset={0} style={{ fontSize: 11, fill: '#9ca3af', textAnchor: 'middle' }} />}
          </YAxis>
          {hasLine && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={lineTickFormatter || yTickFormatter}
              width={60}
              domain={[0, 'auto']}
            >
              {lineAxisLabel && <Label value={lineAxisLabel} angle={90} position="right" offset={0} style={{ fontSize: 11, fill: '#9ca3af', textAnchor: 'middle' }} />}
            </YAxis>
          )}
          <Tooltip
            formatter={(value, name) => getTooltipPayload(value, name, tooltipFormatter)}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontSize: '13px',
            }}
            cursor={{ fill: '#f9fafb', radius: 4 }}
          />
          <Bar dataKey={barKey} yAxisId="left" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {series.map((_, i) => (
              <Cell key={`cell-${i}`} fill={bColor} />
            ))}
          </Bar>
          {hasLine && (
            <Line
              type="monotone"
              dataKey={lineKey}
              yAxisId="right"
              stroke={lColor}
              strokeWidth={2}
              dot={{ r: 3, fill: lColor, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(DualAxisChart);
