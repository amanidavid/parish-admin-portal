import useAdminAuthStore from '@/store/adminAuthStore';
import useUiLoaderStore from '@/store/uiLoaderStore';

export default async function apiFetch(url, options = {}) {
  const { showLoader = true, ...fetchOptions } = options;

  if (showLoader) {
    useUiLoaderStore.getState().start();
  }

  try {
    const res = await fetch(url, { cache: 'no-store', ...fetchOptions });

    if (res.status === 401) {
      useAdminAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return { success: false, message: 'Session expired' };
    }

    return res.json().catch(() => ({ success: false, message: 'Unable to read server response' }));
  } catch {
    return { success: false, message: 'Unable to complete the request right now' };
  } finally {
    if (showLoader) {
      useUiLoaderStore.getState().stop();
    }
  }
}
