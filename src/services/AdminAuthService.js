/**
 * AdminAuthService — server-side BFF service for admin authentication.
 *
 * Used ONLY inside Next.js route handlers (app/api/**).
 * Never import this in client components — it relies on next/headers cookies().
 */
import { cookies } from 'next/headers';

import { ADMIN_TOKEN_KEY, COOKIE_OPTS } from '@/constants/cookies';
import { LARAVEL_ADMIN_API_V1_BASE } from '@/lib/laravelApi';

async function laravelRequest(path, options = {}) {
  const url = `${LARAVEL_ADMIN_API_V1_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({
    success: false,
    message: 'Invalid server response',
    data: null,
    errors: null,
  }));

  return { json, status: res.status };
}

const AdminAuthService = {
  /**
   * Authenticates admin credentials against Laravel, sets httpOnly cookie on success.
   *
   * @param {{ username?: string, email?: string, password: string }} body
   */
  async login(body) {
    const { json, status } = await laravelRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (status === 200 && json?.data?.access_token) {
      const jar = await cookies();
      jar.set(ADMIN_TOKEN_KEY, json.data.access_token, COOKIE_OPTS);
    }

    return { json, status };
  },

  /**
   * Calls Laravel logout then removes the admin cookie.
   */
  async logout() {
    const jar = await cookies();
    const token = jar.get(ADMIN_TOKEN_KEY)?.value;

    if (token) {
      await laravelRequest('/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => { });
    }

    jar.delete(ADMIN_TOKEN_KEY);
  },

  /**
   * Returns the authenticated admin profile or 401 if token is missing/invalid.
   */
  async me() {
    const jar = await cookies();
    const token = jar.get(ADMIN_TOKEN_KEY)?.value;

    if (!token) {
      return { json: { success: false, message: 'Unauthorized', data: null }, status: 401 };
    }

    const { json, status } = await laravelRequest('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (status === 401) {
      jar.delete(ADMIN_TOKEN_KEY);
    }

    return { json, status };
  },
};

export default AdminAuthService;
