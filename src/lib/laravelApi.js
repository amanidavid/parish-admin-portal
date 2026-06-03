const DEFAULT_LARAVEL_ORIGIN = 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';
const ADMIN_API_V1_PREFIX = `${API_V1_PREFIX}/admin`;

function normalizeLaravelOrigin(value) {
  if (!value) return DEFAULT_LARAVEL_ORIGIN;

  return value
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api\/v1(?:\/admin)?$/, '');
}

const laravelOrigin = normalizeLaravelOrigin(process.env.LARAVEL_API_URL);

export const LARAVEL_ORIGIN = laravelOrigin;
export const LARAVEL_API_V1_BASE = `${laravelOrigin}${API_V1_PREFIX}`;
export const LARAVEL_ADMIN_API_V1_BASE = `${laravelOrigin}${ADMIN_API_V1_PREFIX}`;
