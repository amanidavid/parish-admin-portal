/**
 * AutomationService — client-side BFF service for admin automation tasks.
 *
 * All methods call the Next.js BFF proxy (/api/v1/admin/automation/tasks/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import { AUTOMATION_TASKS_PATH } from '@/constants/api';

const AutomationService = {
  /**
   * List all automation task settings.
   */
  index() {
    return apiFetch(AUTOMATION_TASKS_PATH);
  },

  /**
   * Update an automation task setting.
   *
   * @param {string} uuid
   * @param {{ enabled?, schedule_mode?, interval_minutes?, timezone?, cron_expression?, run_at? }} data
   * @param {object} [options]
   */
  update(uuid, data, options = {}) {
    return apiFetch(`${AUTOMATION_TASKS_PATH}/${uuid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      ...options,
    });
  },

  /**
   * Trigger an automation task to run immediately.
   *
   * @param {string} uuid
   * @param {object} [options]
   */
  runNow(uuid, options = {}) {
    return apiFetch(`${AUTOMATION_TASKS_PATH}/${uuid}/run-now`, {
      method: 'POST',
      ...options,
    });
  },

  /**
   * Get execution history for a specific automation task.
   *
   * @param {string} uuid
   * @param {object} [options]
   */
  runs(uuid, options = {}) {
    return apiFetch(`${AUTOMATION_TASKS_PATH}/${uuid}/runs`, { ...options });
  },
};

export default AutomationService;
