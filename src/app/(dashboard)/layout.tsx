'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardProvider, type DashboardUser } from '@/components/dashboard/DashboardContext';
import BrandLoader from '@/components/BrandLoader';

type AuthState = 'loading' | 'authed' | 'unauthed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [state, setState] = useState<AuthState>('loading');

  // Client-side auth guard: confirm a valid session before rendering the
  // dashboard, otherwise send the user to login. (Data endpoints remain
  // protected server-side by the session cookie regardless.)
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          setUser((await res.json()) as DashboardUser);
          setState('authed');
        } else {
          setState('unauthed');
          router.replace('/login');
        }
      })
      .catch(() => {
        if (!active) return;
        setState('unauthed');
        router.replace('/login');
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (state !== 'authed' || !user) {
    return <BrandLoader />;
  }

  return (
    <DashboardProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
