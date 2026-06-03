'use client';

export default function MBadge({ map, value }) {
  const def = map[value] ?? { label: value ?? '—', cls: 'badge-gray' };
  return <span className={`badge ${def.cls}`}>{def.label}</span>;
}
