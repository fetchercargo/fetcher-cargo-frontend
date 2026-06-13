'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import BrandLoader, { BrandDots } from '@/components/BrandLoader';

interface SessionUser {
  role?: string;
  mustChangePassword?: boolean;
}

function destFor(u: SessionUser): string {
  if (u.mustChangePassword) return '/change-password';
  return u.role === 'admin' ? '/admin' : '/dashboard';
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);

  // If a valid session already exists, skip the form.
  useEffect(() => {
    let active = true;
    fetch('/api/auth/me')
      .then(async (res) => {
        if (active && res.ok) {
          router.replace(destFor((await res.json().catch(() => ({}))) as SessionUser));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  // A slow request usually means the free-tier backend is cold-starting.
  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const t = setTimeout(() => setSlow(true), 1200);
    return () => clearTimeout(t);
  }, [loading]);

  async function submitCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Unable to sign in. Please try again.');
        return;
      }
      if (data.otpRequired) {
        setStep('otp');
        setCode('');
        return;
      }
      router.replace(destFor(data as SessionUser));
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setLoading(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'That code is invalid or has expired.');
        return;
      }
      router.replace(destFor(data as SessionUser));
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (res.ok) setNote('A new code has been sent to your email.');
      else setError('Could not resend the code. Go back and sign in again.');
    } catch {
      setError('Unable to connect. Please try again.');
    }
  }

  if (slow) {
    return (
      <div className="fixed inset-0 z-50">
        <BrandLoader title="Signing you in…" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">{step === 'otp' ? 'Enter your code' : 'Sign in'}</h1>
          <p className="text-gray-500 mt-2">
            {step === 'otp' ? `We emailed a 6-digit code to ${email}` : 'Access your Fetcher Cargo account'}
          </p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={submitCredentials} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-brand-dark">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-brand-dark">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-orange transition-colors p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </div>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <BrandDots />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={submitOtp} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="code" className="text-sm font-medium text-brand-dark">Verification code</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                autoFocus
                required
                className="px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-semibold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow"
              />
            </div>

            {note && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">{note}</div>}
            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="w-full px-8 py-3 bg-brand-orange text-white font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <BrandDots />
                  Verifying...
                </>
              ) : (
                'Verify & sign in'
              )}
            </button>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => { setStep('credentials'); setError(null); setNote(null); }} className="font-semibold text-brand-gray hover:text-brand-dark transition-colors">
                ← Back
              </button>
              <button type="button" onClick={resend} className="font-semibold text-brand-orange hover:text-brand-coral transition-colors">
                Resend code
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Authorized personnel only. Contact your administrator for access.
        </p>
      </div>
    </main>
  );
}
