'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BrandLoader, { BrandDots } from '@/components/BrandLoader';

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [role, setRole] = useState<string>('user');
  const [state, setState] = useState<'loading' | 'ready' | 'unauth'>('loading');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setState('unauth');
          router.replace('/login');
          return;
        }
        const u = await res.json().catch(() => ({}));
        setRole(u.role ?? 'user');
        setState('ready');
      })
      .catch(() => {
        if (active) {
          setState('unauth');
          router.replace('/login');
        }
      });
    return () => {
      active = false;
    };
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next.length < 8) return setError('Your new password must be at least 8 characters.');
    if (next !== confirm) return setError('The new passwords do not match.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not change your password.');
        return;
      }
      router.replace(role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (state === 'loading') return <BrandLoader title="Loading…" />;
  if (state === 'unauth') return null;

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">Set a new password</h1>
          <p className="text-gray-500 mt-2">Your account is using a temporary password. Choose a new one to continue.</p>
        </div>

        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current" className="text-sm font-medium text-brand-dark">Current (temporary) password</label>
            <input id="current" type="password" autoComplete="current-password" className={inputCls} value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new" className="text-sm font-medium text-brand-dark">New password</label>
            <input id="new" type="password" autoComplete="new-password" className={inputCls} value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm" className="text-sm font-medium text-brand-dark">Confirm new password</label>
            <input id="confirm" type="password" autoComplete="new-password" className={inputCls} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={submitting || !current || !next || !confirm}
            className="w-full px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <BrandDots />
                Saving...
              </>
            ) : (
              'Set password & continue'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
