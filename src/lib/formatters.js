/**
 * Shared number / date / currency formatters.
 * Import from here instead of redeclaring in every page.
 */

export const fmt = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);

export const fmtAmt = (n) => `TZS ${fmt(n)}`;

export const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

export const fmtCents = (c, cur) =>
  `${cur || 'TZS'} ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((c || 0) / 100)}`;

export const fmtDate = (d) => {
  if (!d) return '—';
  return String(d);
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
