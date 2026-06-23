export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-TZ', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatCurrency(cents, currency = 'TZS') {
  if (cents == null) return '—';
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency', currency, minimumFractionDigits: 0,
  }).format(cents);
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function statusBadgeClass(status) {
  const map = {
    active: 'badge-active',
    inactive: 'badge-inactive',
    occupied: 'badge-occupied',
    vacant: 'badge-vacant',
  };
  return map[status?.toLowerCase()] || 'badge-inactive';
}

export function buildQueryString(params = {}) {
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  if (!filtered.length) return '';
  return '?' + new URLSearchParams(Object.fromEntries(filtered)).toString();
}
