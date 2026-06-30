/**
 * WorkspaceService — client-side BFF service for admin workspace (tenant) operations.
 *
 * All methods call the Next.js BFF proxy (/api/v1/admin/tenants/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { TENANTS_PATH } from '@/constants/api';

const WorkspaceService = {
  /**
   * Paginated workspace list with optional filters.
   *
   * @param {{ search?, status?, provisioning_status?, per_page?, page? }} filters
   */
  index(filters = {}) {
    return apiFetch(`${TENANTS_PATH}${buildQuery(filters)}`);
  },

  /**
   * Single workspace record.
   *
   * @param {string} uuid
   */
  show(uuid) {
    return apiFetch(`${TENANTS_PATH}/${uuid}`);
  },

  /**
   * Core operational counts + subscription state for the workspace detail page.
   *
   * @param {string} uuid
   */
  operationalSummary(uuid) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/operational-summary`);
  },

  /**
   * Contract totals and status breakdown.
   *
   * @param {string} uuid
   * @param {{ currency? }} filters
   */
  contractsSummary(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/contracts/summary${buildQuery(filters)}`);
  },

  /**
   * Property geographic coverage totals.
   *
   * @param {string} uuid
   * @param {{ group_by? }} filters
   */
  propertyLocationSummary(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/properties/location-summary${buildQuery(filters)}`);
  },

  /**
   * Paginated drill-down of one location level.
   *
   * @param {string} uuid
   * @param {{ group_by?, country?, region?, per_page?, page? }} filters
   */
  propertyLocationBreakdown(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/properties/location-breakdown${buildQuery(filters)}`);
  },

  /**
   * Paginated property overview with unit rollups.
   *
   * @param {string} uuid
   * @param {{ search?, status?, sort?, per_page?, page? }} filters
   */
  properties(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/properties${buildQuery(filters)}`);
  },

  /**
   * Paginated workspace staff list.
   *
   * @param {string} uuid
   * @param {{ search?, status?, role?, per_page?, page? }} filters
   */
  staff(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/staff${buildQuery(filters)}`);
  },

  /**
   * Workspace subscription summary with usage and access state.
   *
   * @param {string} uuid
   */
  subscription(uuid) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/subscription`);
  },

  /**
   * Paginated per-property billing estimate breakdown.
   *
   * @param {string} uuid
   * @param {{ search?, status?, sort?, per_page?, page? }} filters
   */
  subscriptionProperties(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/subscription/properties${buildQuery(filters)}`);
  },

  /**
   * Suspend or reactivate a workspace.
   *
   * @param {string} uuid
   * @param {{ status: 'active'|'suspended' }} data
   */
  updateStatus(uuid, data, options = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Change the lifecycle status of the current subscription.
   *
   * @param {string} uuid
   * @param {{ status: 'active'|'trialing'|'past_due'|'canceled', effective_at? }} data
   */
  updateSubscriptionStatus(uuid, data, options = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/subscription-status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Queue a provisioning retry for a failed workspace.
   *
   * @param {string} uuid
   */
  retryProvisioning(uuid, options = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/retry-provisioning`, { method: 'POST', ...options });
  },

  /**
   * Preview the pricing impact of a billing rule change.
   *
   * @param {string} uuid
   * @param {{ unit_price_cents: number, currency: string, effective_from: string, change_timing?: string }} data
   */
  previewBillingRuleChange(uuid, data) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/billing-rule/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Apply a billing rule change immediately or next cycle.
   *
   * @param {string} uuid
   * @param {{ unit_price_cents: number, currency: string, effective_from: string, change_timing?: string }} data
   */
  assignBillingRule(uuid, data) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/billing-rule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Preview the current usage-adjustment state for a workspace.
   *
   * @param {string} uuid
   */
  usageAdjustmentPreview(uuid) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/usage-adjustments/preview`);
  },

  /**
   * Paginated list of usage adjustments for a workspace.
   *
   * @param {string} uuid
   * @param {{ status?, adjustment_type?, sort?, per_page?, page? }} filters
   */
  usageAdjustments(uuid, filters = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/usage-adjustments${buildQuery(filters)}`);
  },

  /**
   * Apply a pending usage adjustment.
   *
   * @param {string} uuid
   * @param {string} adjustmentUuid
   */
  applyUsageAdjustment(uuid, adjustmentUuid, options = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/usage-adjustments/${adjustmentUuid}/apply`, {
      method: 'POST',
      ...options,
    });
  },

  /**
   * Waive a pending usage adjustment.
   *
   * @param {string} uuid
   * @param {string} adjustmentUuid
   */
  waiveUsageAdjustment(uuid, adjustmentUuid, options = {}) {
    return apiFetch(`${TENANTS_PATH}/${uuid}/usage-adjustments/${adjustmentUuid}/waive`, {
      method: 'POST',
      ...options,
    });
  },
};

export default WorkspaceService;
