'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import useAdminAuthStore from '@/store/adminAuthStore';
import { ADMIN_ME_ROUTE } from '@/constants/api';

const SESSION_CHECK_INTERVAL = 5 * 60 * 1000;

function useSessionGuard() {
  const router = useRouter();
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);
  const setAuth = useAdminAuthStore((s) => s.setAuth);
  const intervalRef = useRef(null);

  const expireSession = useCallback(() => {
    clearAuth();
    router.replace('/login?reason=session_expired');
  }, [clearAuth, router]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch(ADMIN_ME_ROUTE, { cache: 'no-store' });
      if (res.status === 401) {
        expireSession();
        return;
      }
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.data?.user) {
          setAuth(data.data.user, data.data.admin ?? null);
        }
      }
    } catch {
      /* network error — don't logout, user might be temporarily offline */
    }
  }, [expireSession, setAuth]);

  useEffect(() => {
    checkSession();

    intervalRef.current = setInterval(checkSession, SESSION_CHECK_INTERVAL);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSession]);
}

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = useAdminAuthStore((s) => s.user);

  useSessionGuard();

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f1f5f9' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar open={sidebarOpen} user={user} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
