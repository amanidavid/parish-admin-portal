'use client';
import { pct } from '@/lib/formatters';

export default function OccBar({ occupied, total }) {
  const w = pct(occupied, total);
  const color = w >= 80 ? '#16a34a' : w >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
        <div className="h-1.5 rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <span className="text-[11px] text-gray-400 shrink-0">{w}%</span>
    </div>
  );
}
