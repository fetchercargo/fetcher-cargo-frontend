'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminShell from '@/components/admin/AdminShell';
import { DashboardProvider, type DashboardUser } from '@/components/dashboard/DashboardContext';
import BrandLoader from '@/components/BrandLoader';

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
    return <BrandLoader />;
  }

  return (
    <DashboardProvider user={user}>
      <AdminShell>{children}</AdminShell>
    </DashboardProvider>
  );
}
