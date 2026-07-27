/**
 * PropertyInvoiceService — client-side BFF service for property invoice operations.
 *
 * All methods call the Next.js BFF proxy which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import buildQuery from '@/lib/query';
import { PROPERTY_INVOICES_PATH } from '@/constants/api';

const PropertyInvoiceService = {
  /**
   * Paginated list of property invoices.
   *
   * @param {{ search?, status?, per_page?, page? }} filters
   */
  index(filters = {}) {
    return apiFetch(`${PROPERTY_INVOICES_PATH}${buildQuery(filters)}`);
  },

  /**
   * Single property invoice detail.
   *
   * @param {string} uuid
   */
  show(uuid) {
    return apiFetch(`${PROPERTY_INVOICES_PATH}/${uuid}`);
  },

  /**
   * Resend reminder for a single property invoice.
   *
   * @param {string} uuid
   * @param {{ channel: 'email'|'sms'|'both', force: boolean }} data
   */
  resendReminder(uuid, data, options = {}) {
    return apiFetch(`${PROPERTY_INVOICES_PATH}/${uuid}/resend-reminder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Bulk resend reminders for property invoices.
   *
   * @param {{
   *   channel: 'email'|'sms'|'both',
   *   force?: boolean,
   *   limit?: number,
   *   invoice_uuids?: string[],
   *   delivery_log_uuids?: string[],
   *   delivery_status?: 'pending'|'sent'|'failed',
   *   source_channel?: 'email'|'sms',
   *   search_by?: 'invoice_number'|'recipient_address',
   *   search?: string,
   *   tenant_uuid?: string,
   *   attempted_from?: string,
   *   attempted_to?: string,
   *   due_from?: string,
   *   due_to?: string
   * }} data
   */
  resendReminders(data, options = {}) {
    return apiFetch(`${PROPERTY_INVOICES_PATH}/resend-reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },
};

export default PropertyInvoiceService;
