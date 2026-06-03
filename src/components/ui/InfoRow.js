'use client';

export default function InfoRow({ label, value, mono }) {
  return (
    <div className="info-card-row">
      <span className="info-card-label">{label}</span>
      <span className={`info-card-value ${mono ? 'font-mono' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}
