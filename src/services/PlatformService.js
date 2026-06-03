/**
 * PlatformService — client-side BFF service for admin platform-level operations.
 *
 * Methods call the Next.js BFF proxy (/api/v1/admin/platform/*)
 * which injects the admin_token cookie before forwarding to Laravel.
 */
import apiFetch from '@/lib/apiFetch';
import { PLATFORM_OVERVIEW_PATH } from '@/constants/api';

const PlatformService = {
  /**
   * Fetch platform overview (summary stats + recent workspaces).
   *
   * @returns {Promise<{success, message, data}>}
   */
  overview() {
    return apiFetch(PLATFORM_OVERVIEW_PATH);
  },
};

export default PlatformService;
