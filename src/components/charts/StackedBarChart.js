'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = {
  active_subscribed_properties: '#16a34a',
  expired_properties: '#dc2626',
  unsubscribed_properties: '#6b7280',
};

const LABELS = {
  active_subscribed_properties: 'Active',
  expired_properties: 'Expired',
  unsubscribed_properties: 'Unsubscribed',
};

export default function StackedBarChart({ data, loading, keys }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 h-[300px] flex items-center justify-center">
        <div className="animate-pulse bg-gray-100 rounded-lg w-full h-48" />
      </div>
    );
  }

  const dataKeys = keys || Object.keys(COLORS);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data || []} margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontSize: '13px',
            }}
            cursor={{ fill: '#f9fafb', radius: 4 }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 font-medium">{LABELS[value] || value}</span>
            )}
          />
          {dataKeys.map((key) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={COLORS[key] || '#9ca3af'}
              radius={key === dataKeys[dataKeys.length - 1] ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
