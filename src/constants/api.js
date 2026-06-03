/**
 * API route constants — Next.js BFF proxy paths.
 *
 * These are the client-side paths that hit the Next.js API routes,
 * which then forward to Laravel using LARAVEL_API_URL.
 */
export const ADMIN_API_BASE = '/api/v1/admin';

export const TENANTS_PATH = `${ADMIN_API_BASE}/tenants`;
export const BILLING_PATH = `${ADMIN_API_BASE}/billing-profiles`;
export const BILLING_RULES_PATH = `${ADMIN_API_BASE}/billing-rules`;
export const PLATFORM_OVERVIEW_PATH = `${ADMIN_API_BASE}/platform/overview`;

// BFF auth routes (Next.js internal)
export const ADMIN_LOGIN_ROUTE = '/api/admin/auth/login';
export const ADMIN_LOGOUT_ROUTE = '/api/admin/auth/logout';
export const ADMIN_ME_ROUTE = '/api/admin/auth/me';
