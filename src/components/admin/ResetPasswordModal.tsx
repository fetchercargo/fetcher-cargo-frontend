'use client';

import { useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

export default function ResetPasswordModal({ userId, email, onClose }: { userId: number; email: string; onClose: () => void }) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not reset the password.');
        return;
      }
      setDone(true);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-brand-dark">Reset password</h2>
        <p className="text-sm text-gray-500 mt-1">For {email}</p>
        {done ? (
          <div className="mt-4">
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">Password updated.</p>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4">
            <input
              type="password"
              autoFocus
              className={inputCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password (at least 8 characters)"
              autoComplete="new-password"
            />
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <BrandDots /> Saving…
                  </span>
                ) : (
                  'Reset password'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
