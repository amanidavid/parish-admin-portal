'use client';

export default function StatCard({ label, value, icon, color, bg, loading, href, children }) {
  const inner = (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex items-center gap-3 min-h-[80px]">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <svg className="w-5 h-5" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={icon} />
        </svg>
      </div>
      <div>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider leading-none mb-1">{label}</p>
        {loading
          ? <div className="animate-pulse bg-gray-100 rounded w-14 h-7" />
          : <p className="text-xl font-black text-gray-900 tabular-nums">{value ?? '—'}</p>}
      </div>
      {children}
    </div>
  );
  return href ? <a href={href} className="block">{inner}</a> : inner;
}
