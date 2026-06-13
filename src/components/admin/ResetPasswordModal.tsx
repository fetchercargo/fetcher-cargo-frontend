'use client';

import { useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';

export default function ResetPasswordModal({ userId, email, onClose }: { userId: number; email: string; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ tempPassword: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  async function reset() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not reset the password.');
        return;
      }
      setResult({ tempPassword: d.tempPassword, emailed: d.emailed });
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard?.writeText(result.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-brand-dark">Reset password</h2>
        <p className="text-sm text-gray-500 mt-1">For {email}</p>

        {result ? (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-1">New temporary password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg text-brand-dark tracking-wide break-all">{result.tempPassword}</code>
              <button onClick={copy} className="px-3 py-3 text-sm font-semibold text-brand-orange border border-gray-200 rounded-lg hover:border-brand-orange transition-colors whitespace-nowrap">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className={`text-sm mt-3 ${result.emailed ? 'text-green-700' : 'text-amber-700'}`}>
              {result.emailed ? 'We emailed the new temporary password to the user.' : 'Email is not configured — share this password with the user securely.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">They will be asked to set a new password on next login.</p>
            <div className="flex justify-end mt-4">
              <button onClick={onClose} className="px-5 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              A new temporary password will be generated{' '}
              {email ? 'and emailed to the user (if email is configured)' : ''}. They will be required to set a new password on their next login.
            </p>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
                Cancel
              </button>
              <button type="button" onClick={reset} disabled={submitting} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <BrandDots /> Resetting…
                  </span>
                ) : (
                  'Reset & email password'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
