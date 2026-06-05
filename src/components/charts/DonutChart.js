'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = {
  active: '#16a34a',
  expired: '#dc2626',
  unsubscribed: '#6b7280',
};

const LABELS = {
  active: 'Active',
  expired: 'Expired',
  unsubscribed: 'Unsubscribed',
};

export default function DonutChart({ data, loading, innerLabel, innerValue }) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 h-[320px] flex items-center justify-center">
        <div className="animate-pulse bg-gray-100 rounded-full w-40 h-40" />
      </div>
    );
  }

  const chartData = (data || []).map((item) => ({
    name: LABELS[item.status] || item.label || item.status,
    value: item.properties_count || 0,
    color: COLORS[item.status] || '#9ca3af',
  })).filter((d) => d.value > 0);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value, 'Properties']}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #f3f4f6',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              fontSize: '13px',
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-gray-600 font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {innerLabel && (
        <div className="text-center -mt-36 mb-16 pointer-events-none">
          <p className="text-2xl font-black text-gray-900">{innerValue ?? total}</p>
          <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">{innerLabel}</p>
        </div>
      )}
    </div>
  );
}
