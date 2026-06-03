/**
 * Shared number / date / currency formatters.
 * Import from here instead of redeclaring in every page.
 */

export const fmt = (n) => new Intl.NumberFormat('en-US').format(n ?? 0);

export const fmtAmt = (n) => `TZS ${fmt(n)}`;

export const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);

export const fmtCents = (c, cur) =>
  `${cur || 'TZS'} ${new Intl.NumberFormat('en-US').format((c || 0) / 100)}`;

export const fmtDate = (d, opts = {}) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  });
};

export const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
