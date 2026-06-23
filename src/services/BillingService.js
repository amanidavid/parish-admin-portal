/**
 * BillingService — client-side BFF service for admin billing rules operations.
 *
 * All methods call the Next.js BFF proxy (/api/v1/admin/billing-rules/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { BILLING_PATH } from '@/constants/api';

const BillingService = {
  /**
   * Paginated billing rules list with optional filters.
   *
   * @param {{ status?, effective_on?, registered_units?, per_page?, page? }} filters
   */
  index(filters = {}) {
    return apiFetch(`${BILLING_PATH}${buildQuery(filters)}`);
  },

  /**
   * Single billing rule.
   *
   * @param {string} uuid
   */
  show(uuid) {
    return apiFetch(`${BILLING_PATH}/${uuid}`);
  },

  /**
   * Create a new billing rule.
   *
   * @param {{ range_start, range_end?, price_cents, currency, effective_from, effective_to?, sort_order?, status? }} data
   */
  store(data) {
    return apiFetch(BILLING_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an existing billing rule.
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
};

export default BillingService;
