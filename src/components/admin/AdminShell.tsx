'use client';

import { useState, type FC } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

import { useDashboardUser } from '@/components/dashboard/DashboardContext';

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      {children}
    </svg>
  );
}

const OverviewIcon: FC = () => (
  <Icon>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </Icon>
);
const ShipmentsIcon: FC = () => (
  <Icon>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <path d="M3.27 6.96 12 12.01l8.73-5.05" />
    <path d="M12 22.08V12" />
  </Icon>
);
const CreateIcon: FC = () => (
  <Icon>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 8v8M8 12h8" />
  </Icon>
);
const UsersIcon: FC = () => (
  <Icon>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);
const PincodeIcon: FC = () => (
  <Icon>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </Icon>
);

const SettingsIcon: FC = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Icon>
);

const LinksIcon: FC = () => (
  <Icon>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);

interface AdminNavItem {
  label: string;
  href: string;
  icon: FC;
  match: (path: string) => boolean;
}

const ADMIN_NAV: AdminNavItem[] = [
  { label: 'Overview', href: '/admin', icon: OverviewIcon, match: (p) => p === '/admin' },
  { label: 'Shipments', href: '/admin/shipments', icon: ShipmentsIcon, match: (p) => p.startsWith('/admin/shipments') && p !== '/admin/shipments/new' },
  { label: 'Create Shipment', href: '/admin/shipments/new', icon: CreateIcon, match: (p) => p === '/admin/shipments/new' },
  { label: 'Users', href: '/admin/users', icon: UsersIcon, match: (p) => p.startsWith('/admin/users') },
  { label: 'Pincodes', href: '/admin/pincodes', icon: PincodeIcon, match: (p) => p.startsWith('/admin/pincodes') },
  { label: 'Links', href: '/admin/links', icon: LinksIcon, match: (p) => p.startsWith('/admin/links') },
  { label: 'Settings', href: '/admin/settings', icon: SettingsIcon, match: (p) => p.startsWith('/admin/settings') },
];

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {ADMIN_NAV.map((item) => {
        const ItemIcon = item.icon;
        const active = item.match(pathname);
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-orange-50 text-brand-orange' : 'text-brand-gray hover:bg-gray-50 hover:text-brand-dark'
            }`}
          >
            <ItemIcon />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const user = useDashboardUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore — still send to login
    }
    router.replace('/login');
  }

  const displayName = user.name || user.email;
  const initials = (user.name || user.email)
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen flex flex-col bg-brand-light-gray">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="lg:hidden p-2 -ml-2 text-brand-dark" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </button>
            <Link href="/admin" className="flex-shrink-0">
              <Image src="/logo.jpg" alt="Fetcher Cargo" width={1024} height={375} priority style={{ width: '150px', maxWidth: '150px' }} className="h-auto" />
            </Link>
            <span className="hidden sm:inline text-[11px] font-semibold uppercase tracking-wide bg-brand-purple text-white px-2 py-0.5 rounded">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-brand-dark">{displayName}</span>
              <span className="text-[11px] uppercase tracking-wide text-gray-400">{user.role}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-brand-purple text-white flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="px-3 py-2 text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">{loggingOut ? 'Signing out…' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
          <SidebarNav />
        </aside>

        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
                <span className="font-semibold text-brand-dark">Admin menu</span>
                <button onClick={() => setSidebarOpen(false)} className="p-2 text-brand-dark" aria-label="Close menu">
                  <CloseIcon />
                </button>
              </div>
              <SidebarNav onNavigate={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
