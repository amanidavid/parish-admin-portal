'use client';
import { memo } from 'react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Label,
} from 'recharts';

const DEFAULT_COLOR = '#ea580c';

function SimpleBarChart({
  data,
  dataKey,
  xKey,
  color,
  loading,
  tooltipFormatter,
  yTickFormatter,
  xAxisLabel,
  yAxisLabel,
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

  const chartColor = color || DEFAULT_COLOR;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={series} margin={{ top: 5, right: 10, left: 15, bottom: 25 }}>
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
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={yTickFormatter}
            width={60}
            domain={[0, 'auto']}
          >
            {yAxisLabel && <Label value={yAxisLabel} angle={-90} position="left" offset={0} style={{ fontSize: 11, fill: '#9ca3af', textAnchor: 'middle' }} />}
          </YAxis>
          <Tooltip
            formatter={(value) => [tooltipFormatter ? tooltipFormatter(value) : value, '']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontSize: '13px',
            }}
            cursor={{ fill: '#f9fafb', radius: 4 }}
          />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={40}>
            {series.map((_, i) => (
              <Cell key={`cell-${i}`} fill={chartColor} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(SimpleBarChart);
