/**
 * AnalyticsService — client-side BFF service for admin analytics & charts.
 *
 * All methods call the Next.js BFF proxy
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { ANALYTICS_PATH } from '@/constants/api';

const AnalyticsService = {
  /**
   * Revenue trend over time buckets.
   * @param {{ period?, anchor_date?, start_date?, end_date?, bucket_by? }} filters
   */
  revenueTrend(filters = {}) {
    return apiFetch(`${ANALYTICS_PATH}/revenue-trend${buildQuery(filters)}`);
  },

  /**
   * Subscription status (active/expired/unsubscribed) trend over time.
   * @param {{ period?, anchor_date?, start_date?, end_date?, bucket_by? }} filters
   */
  subscriptionStatusTrend(filters = {}) {
    return apiFetch(`${ANALYTICS_PATH}/subscription-status-trend${buildQuery(filters)}`);
  },

  /**
   * Property onboarding growth trend over time.
   * @param {{ period?, anchor_date?, start_date?, end_date?, bucket_by?, include_cumulative? }} filters
   */
  propertyGrowthTrend(filters = {}) {
    return apiFetch(`${ANALYTICS_PATH}/property-growth-trend${buildQuery(filters)}`);
  },

  /**
   * Current subscription status split (donut chart data).
   */
  subscriptionStatusSplit() {
    return apiFetch(`${ANALYTICS_PATH}/subscription-status-split`);
  },

  /**
   * Top performing billing rules.
   * @param {{ period?, anchor_date?, start_date?, end_date?, bucket_by?, limit? }} filters
   */
  topBillingRules(filters = {}) {
    return apiFetch(`${ANALYTICS_PATH}/top-billing-rules${buildQuery(filters)}`);
  },
};

export default AnalyticsService;
