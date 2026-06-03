'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAdminAuthStore from '@/store/adminAuthStore';
import { ADMIN_LOGOUT_ROUTE } from '@/constants/api';

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'A';
  return (
    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

export default function TopBar({ sidebarOpen, toggleSidebar }) {
  const router = useRouter();
  const user = useAdminAuthStore((s) => s.user);
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch(ADMIN_LOGOUT_ROUTE, { method: 'POST' }).catch(() => { });
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center gap-4 px-4 shrink-0 z-10">
      {/* Sidebar toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white hover:bg-primary-700 transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
            d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>

      {/* Page title breadcrumb area */}
      <div className="flex-1" />

      {/* Right: user menu */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mr-1">
          <span className="w-2 h-2 rounded-full bg-primary-500"></span>
          <span className="text-xs font-semibold text-primary-700">Admin</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-xl pl-1 pr-3 py-1.5 hover:bg-gray-50 transition-colors"
          >
            <Avatar name={user?.name || user?.username} />
            <div className="hidden md:block text-left">
              <p className="text-[13px] font-semibold text-gray-900 leading-tight">
                {user?.name || user?.username || 'Admin'}
              </p>
              <p className="text-[11px] text-gray-400 leading-tight">
                {user?.email || 'Administrator'}
              </p>
            </div>
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-12 w-52 bg-white rounded-xl border border-gray-200 shadow-xl z-30 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <Avatar name={user?.name || user?.username} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.name || user?.username || 'Admin'}
                    </p>
                    <p className="text-xs text-primary-600 font-medium">Administrator</p>
                  </div>
                </div>
                <div className="border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {loggingOut ? 'Signing out...' : 'Sign out'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
