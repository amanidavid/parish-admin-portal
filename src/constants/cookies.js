/**
 * Cookie constants — single source of truth for admin auth cookie.
 */
export const ADMIN_TOKEN_KEY = 'admin_token';

export const COOKIE_OPTS = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
});
