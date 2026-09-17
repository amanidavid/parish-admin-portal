/**
 * HistoricalContractGrantService — client-side BFF service for admin
 * historical contract entry grants.
 *
 * Grants are tenant (workspace) scoped. All methods call the Next.js BFF
 * proxy (/api/v1/admin/tenants/{tenantUuid}/historical-contract-entry-grants/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { HISTORICAL_CONTRACT_GRANTS_PATH } from '@/constants/api';

const RESOURCE = 'historical-contract-entry-grants';

function base(tenantUuid) {
  return `${HISTORICAL_CONTRACT_GRANTS_PATH}/${tenantUuid}/${RESOURCE}`;
}

const HistoricalContractGrantService = {
  /**
   * Paginated list of grants with optional filters.
   *
   * @param {string} tenantUuid
   * @param {{ status?, scope?, property_uuid?, sort?, per_page?, page? }} filters
   */
  index(tenantUuid, filters = {}) {
    return apiFetch(`${base(tenantUuid)}${buildQuery(filters)}`);
  },

  /**
   * Create a grant. Omit `property_uuid` for a workspace-wide grant.
   *
   * @param {string} tenantUuid
   * @param {{
   *   historical_start_date_from: string,
   *   historical_start_date_to: string,
   *   usable_from?: string,
   *   expires_at: string,
   *   reason: string,
   *   property_uuid?: string,
   *   meta?: Record<string, any>
   * }} data
   */
  create(tenantUuid, data, options = {}) {
    return apiFetch(base(tenantUuid), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Revoke a grant.
   *
   * @param {string} tenantUuid
   * @param {string} grantUuid
   * @param {{ reason: string }} data
   */
  revoke(tenantUuid, grantUuid, data, options = {}) {
    return apiFetch(`${base(tenantUuid)}/${grantUuid}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },
};

export default HistoricalContractGrantService;
