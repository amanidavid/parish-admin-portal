/**
 * BillingService — client-side BFF service for admin billing profile operations.
 *
 * All methods call the Next.js BFF proxy (/api/v1/admin/billing-profiles/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { BILLING_PATH, BILLING_RULES_PATH } from '@/constants/api';

const BillingService = {
  /**
   * Paginated billing profiles list with optional filters.
   *
   * @param {{ search?, status?, billing_interval?, per_page?, page? }} filters
   */
  index(filters = {}) {
    return apiFetch(`${BILLING_PATH}${buildQuery(filters)}`);
  },

  /**
   * Single billing profile with rule count.
   *
   * @param {string} uuid
   */
  show(uuid) {
    return apiFetch(`${BILLING_PATH}/${uuid}`);
  },

  /**
   * Create a new billing profile.
   *
   * @param {{ name, billing_interval, description?, trial_days?, grace_days?, currency?, is_default?, status? }} data
   */
  store(data) {
    return apiFetch(BILLING_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing billing profile.
   *
   * @param {string} uuid
   * @param {object} data
   */
  update(uuid, data) {
    return apiFetch(`${BILLING_PATH}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Paginated pricing rules for a billing profile.
   *
   * @param {string} profileUuid
   * @param {{ status?, effective_on?, per_page?, page? }} filters
   */
  rules(profileUuid, filters = {}) {
    return apiFetch(`${BILLING_PATH}/${profileUuid}/rules${buildQuery(filters)}`);
  },

  /**
   * Add a new pricing rule to a billing profile.
   *
   * @param {string} profileUuid
   * @param {{ range_start, price_cents, effective_from, range_end?, currency?, effective_to?, sort_order?, status? }} data
   */
  storeRule(profileUuid, data) {
    return apiFetch(`${BILLING_PATH}/${profileUuid}/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing billing rule.
   *
   * @param {string} ruleUuid
   * @param {object} data
   */
  updateRule(ruleUuid, data) {
    return apiFetch(`${BILLING_RULES_PATH}/${ruleUuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },
};

export default BillingService;
