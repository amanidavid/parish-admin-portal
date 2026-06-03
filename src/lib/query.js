/**
 * buildQuery — shared URLSearchParams builder for paginated / filtered API calls.
 *
 * @param {Record<string, any>} params
 * @returns {string}  e.g. "?page=1&per_page=15"
 */
export default function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') qs.set(key, String(val));
  });
  const str = qs.toString();
  return str ? `?${str}` : '';
}
