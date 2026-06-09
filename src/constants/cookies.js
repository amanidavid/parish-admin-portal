/**
 * Cookie constants — single source of truth for admin auth cookie.
 */
export const ADMIN_TOKEN_KEY = 'admin_token';

export const COOKIE_OPTS = Object.freeze({
  httpOnly: true,
  // Only mark cookies as `secure` when explicitly serving over HTTPS.
  // Browsers refuse to send `secure` cookies over plain HTTP (except localhost),
  // which would break the auth session on an HTTP deployment.
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
});
