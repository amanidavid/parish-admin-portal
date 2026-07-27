/**
 * API route constants — Next.js BFF proxy paths.
 *
 * These are the client-side paths that hit the Next.js API routes,
 * which then forward to Laravel using LARAVEL_API_URL.
 */
export const ADMIN_API_BASE = '/api/v1/admin';

export const TENANTS_PATH = `${ADMIN_API_BASE}/tenants`;
export const BILLING_PATH = `${ADMIN_API_BASE}/billing-rules`;
export const PLATFORM_OVERVIEW_PATH = `${ADMIN_API_BASE}/platform/overview`;
export const PROPERTY_SUBSCRIPTION_PATH = `${ADMIN_API_BASE}/tenants`; // tenant prefix for property subscriptions
export const PROPERTY_SUBSCRIPTION_PAYMENT_PATH = `${ADMIN_API_BASE}/tenants`; // tenant prefix for payments
export const PROPERTY_INVOICES_PATH = `${ADMIN_API_BASE}/property-invoices`;
export const REPORTS_PATH = `${ADMIN_API_BASE}/reports`;
export const AUTOMATION_TASKS_PATH = `${ADMIN_API_BASE}/automation/tasks`;
export const ANALYTICS_PATH = `${ADMIN_API_BASE}/analytics`;

// BFF auth routes (Next.js internal)
export const ADMIN_LOGIN_ROUTE = '/api/admin/auth/login';
export const ADMIN_LOGOUT_ROUTE = '/api/admin/auth/logout';
export const ADMIN_ME_ROUTE = '/api/admin/auth/me';
export const ADMIN_FORGOT_PASSWORD_ROUTE = '/api/admin/auth/forgot-password';
export const APP_AUTH_FORGOT_PASSWORD_ROUTE = '/api/app/auth/forgot-password';
export const APP_AUTH_RESET_PASSWORD_ROUTE = '/api/app/auth/reset-password';
