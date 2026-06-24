'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAdminAuthStore from '@/store/adminAuthStore';
import { APP_NAME } from '@/constants/app';

const NAV_GROUPS = [
  {
    group: 'Main',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
    ],
  },
  {
    group: 'Platform',
    items: [
      {
        href: '/workspaces',
        label: 'Workspaces',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        href: '/billing',
        label: 'Billing Rules',
        icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
      },
    ],
  },
  {
    group: 'Reports',
    items: [
      {
        href: '/reports/property-subscriptions/by-workspace',
        label: 'Subscriptions Report',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
      {
        href: '/reports/property-subscriptions/expired',
        label: 'Expired Subscriptions',
        icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        href: '/reports/property-subscription-payments/summary',
        label: 'Payment Summary',
        icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      },
    ],
  },
  {
    group: 'Automation',
    items: [
      {
        href: '/automation/tasks',
        label: 'Automation Tasks',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1.608.918 2.8.613 2.573-1.066z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      },
    ],
  },
];

function NavIcon({ d }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {d.split(' M').map((segment, i) => (
        <path
          key={i}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d={i === 0 ? segment : 'M' + segment}
        />
      ))}
    </svg>
  );
}

function NavItem({ item, active, open }) {
  return (
    <Link
      href={item.href}
      title={!open ? item.label : undefined}
      className={[
        'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg mb-0.5 transition-all duration-150 group',
        active
          ? 'bg-primary-50 text-primary-700'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white',
      ].join(' ')}
    >
      <span className={active ? 'text-primary-500' : 'text-slate-500 group-hover:text-white'}>
        <NavIcon d={item.icon} />
      </span>
      {open && (
        <span className={`text-sm font-medium whitespace-nowrap flex-1 ${active ? 'text-primary-600' : 'text-slate-300 group-hover:text-white'
          }`}>
          {item.label}
        </span>
      )}
      {open && active && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0" />
      )}
    </Link>
  );
}

export default function Sidebar({ open, user }) {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAdminAuthStore((s) => s.clearAuth);

  const isActive = (href) =>
    href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = useCallback(async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => { });
    clearAuth();
    router.push('/login');
  }, [clearAuth, router]);

  return (
    <aside
      className={[
        'flex flex-col h-full transition-all duration-300 shrink-0',
        'fixed inset-y-0 left-0 z-40 bg-sidebar',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        'md:relative md:inset-auto md:z-auto md:translate-x-0 md:shadow-none',
      ].join(' ')}
      style={{ width: open ? '240px' : '68px' }}
    >
      {/* Logo */}
      <div className={`flex items-center border-b border-white/5 h-16 shrink-0 ${open ? 'px-5 gap-3' : 'px-0 justify-center'
        }`}>
        <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        {open && (
          <div>
            <span className="font-bold text-white text-[15px] whitespace-nowrap tracking-tight block leading-tight">
              {APP_NAME}
            </span>
            <span className="text-[10px] text-primary-400 font-semibold tracking-widest uppercase">Admin Portal</span>
          </div>
        )}
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-3">
        {NAV_GROUPS.map((section) => (
          <div key={section.group} className="mb-4">
            {open && (
              <p className="px-5 mb-1 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                {section.group}
              </p>
            )}
            {!open && section.group !== 'Main' && (
              <div className="mx-4 border-t border-white/5 mb-2" />
            )}
            {section.items.map((item) => (
              <NavItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                open={open}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom: user + logout */}
      <div className="shrink-0 border-t border-white/5 p-3 space-y-1">
        {open && user && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
            <div className="w-7 h-7 rounded-full bg-primary-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">
                {(user.name || user.username || 'A').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name || user.username}</p>
              <p className="text-[10px] text-slate-400 truncate">Administrator</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={!open ? 'Sign out' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400
            hover:bg-red-900/30 hover:text-red-400 transition-colors group ${!open ? 'justify-center' : ''
            }`}
        >
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {open && <span className="text-sm font-medium">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
