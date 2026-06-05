'use client';

import { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const DEFAULT_COLOR = '#f97316';

function HorizontalBarChart({
  data,
  xKey,
  yKey,
  color,
  loading,
  tooltipFormatter,
  xTickFormatter,
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
        <BarChart
          data={series}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 15, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={xTickFormatter}
          />
          <YAxis
            type="category"
            dataKey={yKey}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value, name) => {
              if (tooltipFormatter) return tooltipFormatter(value, name);
              return [value, name];
            }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontSize: '13px',
            }}
            cursor={{ fill: '#f9fafb' }}
          />
          <Bar dataKey={xKey} radius={[0, 6, 6, 0]} maxBarSize={28} fill={chartColor} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(HorizontalBarChart);
