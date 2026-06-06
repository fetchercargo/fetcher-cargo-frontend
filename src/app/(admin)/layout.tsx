'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminShell from '@/components/admin/AdminShell';
import { DashboardProvider, type DashboardUser } from '@/components/dashboard/DashboardContext';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-light-gray">
      <svg className="animate-spin h-8 w-8 text-brand-orange" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

type State = 'loading' | 'admin' | 'denied';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [state, setState] = useState<State>('loading');

  // Role-gated client guard: only admins render the panel. Non-admins go to the
  // dashboard; unauthenticated users go to login. (Server also enforces role.)
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setState('denied');
          router.replace('/login');
          return;
        }
        const u = (await res.json()) as DashboardUser;
        if (u.role !== 'admin') {
          setState('denied');
          router.replace('/dashboard');
          return;
        }
        setUser(u);
        setState('admin');
      })
      .catch(() => {
        if (!active) return;
        setState('denied');
        router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (state !== 'admin' || !user) {
    return <FullScreenLoader />;
  }

  return (
    <DashboardProvider user={user}>
      <AdminShell>{children}</AdminShell>
    </DashboardProvider>
  );
}
