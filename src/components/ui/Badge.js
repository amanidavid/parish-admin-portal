'use client';

export default function Badge({ map, value }) {
  const def = map[value] ?? { label: value ?? '—', cls: 'badge-gray' };
  const hasStyle = def.color && def.bg;
  return (
    <span
      className={`badge ${def.cls ?? ''}`}
      style={
        hasStyle
          ? { color: def.color, backgroundColor: def.bg, borderColor: def.color + '33' }
          : undefined
      }
    >
      {def.label}
    </span>
  );
}
