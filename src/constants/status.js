/**
 * Shared status / badge / color maps used across admin pages.
 * Import from here instead of redeclaring in every page.
 */

// ─── Workspace / Tenant ──────────────────────────────────────────────────────
export const WORKSPACE_STATUS_MAP = Object.freeze({
  active: { label: 'Active', cls: 'badge-green' },
  suspended: { label: 'Suspended', cls: 'badge-red' },
  inactive: { label: 'Inactive', cls: 'badge-gray' },
});

export const PROV_MAP = Object.freeze({
  ready: { label: 'Provisioned', cls: 'badge-green' },
  provisioning: { label: 'Provisioning', cls: 'badge-amber' },
  pending: { label: 'Pending', cls: 'badge-amber' },
  failed: { label: 'Failed', cls: 'badge-red' },
});

// ─── Billing ─────────────────────────────────────────────────────────────────
export const BILLING_STATUS_MAP = Object.freeze({
  active: { label: 'Active', cls: 'badge-green' },
  inactive: { label: 'Inactive', cls: 'badge-gray' },
});

export const RULE_STATUS_MAP = Object.freeze({
  active: { label: 'Active', cls: 'badge-green' },
  inactive: { label: 'Inactive', cls: 'badge-gray' },
});

export const INTERVAL_MAP = Object.freeze({
  monthly: { label: 'Monthly', cls: 'badge-blue' },
  quarterly: { label: 'Quarterly', cls: 'badge-purple' },
  annually: { label: 'Annually', cls: 'badge-amber' },
});

// ─── Subscription ──────────────────────────────────────────────────────────────
export const SUB_STATUS_MAP = Object.freeze({
  active: { label: 'Active', cls: 'badge-green' },
  trialing: { label: 'Trialing', cls: 'badge-blue' },
  past_due: { label: 'Past Due', cls: 'badge-amber' },
  canceled: { label: 'Canceled', cls: 'badge-red' },
});

// ─── Access State (workspace detail header) ────────────────────────────────────
export const ACCESS_CFG = Object.freeze({
  active: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d', dot: '#16a34a', label: 'Active' },
  trial: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', dot: '#d97706', label: 'Trial' },
  blocked: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626', label: 'Blocked' },
  suspended: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', dot: '#dc2626', label: 'Suspended' },
});

// ─── Usage Adjustments ──────────────────────────────────────────────────────
export const ADJUSTMENT_STATUS_MAP = Object.freeze({
  pending: { label: 'Pending', cls: 'badge-amber' },
  applied: { label: 'Applied', cls: 'badge-green' },
  waived: { label: 'Waived', cls: 'badge-gray' },
  superseded: { label: 'Superseded', cls: 'badge-red' },
});

export const ADJUSTMENT_TYPE_MAP = Object.freeze({
  charge: { label: 'Charge', cls: 'badge-red' },
  credit: { label: 'Credit', cls: 'badge-green' },
  none: { label: 'None', cls: 'badge-gray' },
});

// ─── Contracts ─────────────────────────────────────────────────────────────────
export const BILLING_CURRENCIES = Object.freeze(['TZS', 'USD', 'EUR', 'GBP']);

export const BILLING_INTERVALS = Object.freeze([
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
]);

export const CT_COLORS = Object.freeze({
  active: '#16a34a',
  draft: '#6b7280',
  expired: '#dc2626',
  terminated: '#b91c1c',
  renewed: '#0891b2',
});
