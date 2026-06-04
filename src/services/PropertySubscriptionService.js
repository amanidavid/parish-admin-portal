/**
 * PropertySubscriptionService — client-side BFF service for admin
 * property subscription and payment operations.
 *
 * All methods call the Next.js BFF proxy
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { PROPERTY_SUBSCRIPTION_PATH, PROPERTY_SUBSCRIPTION_PAYMENT_PATH, REPORTS_PATH } from '@/constants/api';

function tenantPath(uuid) {
  return `${PROPERTY_SUBSCRIPTION_PATH}/${uuid}`;
}

const PropertySubscriptionService = {
  /**
   * Paginated list of property subscriptions for a workspace.
   *
   * @param {string} uuid — workspace uuid
   * @param {{ subscription_status?, search?, per_page?, page? }} filters
   */
  index(uuid, filters = {}) {
    return apiFetch(`${tenantPath(uuid)}/property-subscriptions${buildQuery(filters)}`);
  },

  /**
   * Single property subscription detail.
   *
   * @param {string} uuid — workspace uuid
   * @param {string} propertyUuid
   */
  show(uuid, propertyUuid) {
    return apiFetch(`${tenantPath(uuid)}/property-subscriptions/${propertyUuid}`);
  },

  /**
   * Preview a property subscription payment before recording it.
   *
   * @param {string} uuid — workspace uuid
   * @param {{ property_uuid, billing_rule_uuid, months_paid, payment_date, reference_number?, notes? }} data
   * @param {object} [options]
   */
  previewPayment(uuid, data, options = {}) {
    return apiFetch(`${tenantPath(uuid)}/property-subscription-payments/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Record a property subscription payment.
   *
   * @param {string} uuid — workspace uuid
   * @param {{ property_uuid, billing_rule_uuid, months_paid, payment_date, reference_number?, notes? }} data
   * @param {object} [options]
   */
  recordPayment(uuid, data, options = {}) {
    return apiFetch(`${tenantPath(uuid)}/property-subscription-payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Paginated list of property subscription payments for a workspace.
   *
   * @param {string} uuid — workspace uuid
   * @param {{ per_page?, page? }} filters
   */
  payments(uuid, filters = {}) {
    return apiFetch(`${tenantPath(uuid)}/property-subscription-payments${buildQuery(filters)}`);
  },

  /**
   * Property subscription payment summary report.
   */
  paymentSummaryReport() {
    return apiFetch(`${REPORTS_PATH}/property-subscription-payments/summary`);
  },

  /**
   * Workspace property subscription report.
   *
   * @param {{ start_date?, end_date?, per_page?, page?, sort? }} filters
   */
  byWorkspaceReport(filters = {}) {
    return apiFetch(`${REPORTS_PATH}/property-subscriptions/by-workspace${buildQuery(filters)}`);
  },

  /**
   * Expired property subscription report.
   *
   * @param {{ per_page?, page? }} filters
   */
  expiredReport(filters = {}) {
    return apiFetch(`${REPORTS_PATH}/property-subscriptions/expired${buildQuery(filters)}`);
  },

  /**
   * Full paginated payment history for a specific property subscription.
   *
   * @param {string} uuid — workspace uuid
   * @param {string} propertyUuid
   * @param {{ per_page?, page? }} filters
   */
  propertyPayments(uuid, propertyUuid, filters = {}) {
    return apiFetch(`${tenantPath(uuid)}/property-subscriptions/${propertyUuid}/payments${buildQuery(filters)}`);
  },
};

export default PropertySubscriptionService;
