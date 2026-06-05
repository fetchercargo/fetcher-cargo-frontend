'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import DashboardShell from '@/components/dashboard/DashboardShell';
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
    return <FullScreenLoader />;
  }

  return (
    <DashboardProvider user={user}>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
