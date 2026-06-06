'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';

import { useDashboardUser } from './DashboardContext';
import { NAV_ITEMS } from './nav';

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
      {NAV_ITEMS.map((item) => {
        const ItemIcon = item.icon;
        const active = !!item.href && item.href.startsWith('/dashboard') && pathname === item.href;

        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-orange-50 text-brand-orange'
                  : 'text-brand-gray hover:bg-gray-50 hover:text-brand-dark'
              }`}
            >
              <ItemIcon />
              <span>{item.label}</span>
            </Link>
          );
        }

        return (
          <div
            key={item.label}
            title="Coming soon"
            aria-disabled="true"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed select-none"
          >
            <ItemIcon />
            <span className="flex-1">{item.label}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">
              Soon
            </span>
          </div>
        );
      })}
    </nav>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = useDashboardUser();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the network call fails, send the user to login.
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
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="lg:hidden p-2 -ml-2 text-brand-dark"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>
            <Link href="/dashboard" className="flex-shrink-0">
              <Image
                src="/logo.jpg"
                alt="Fetcher Cargo"
                width={1024}
                height={375}
                priority
                style={{ width: '150px', maxWidth: '150px' }}
                className="h-auto"
              />
            </Link>
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
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-gray-200 bg-white">
          <SidebarNav />
        </aside>

        {/* Sidebar — mobile drawer */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl flex flex-col">
              <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
                <span className="font-semibold text-brand-dark">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-brand-dark"
                  aria-label="Close menu"
                >
                  <CloseIcon />
                </button>
              </div>
              <SidebarNav onNavigate={() => setSidebarOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
