'use client';

import { useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

export default function DeactivateModal({
  userId,
  name,
  email,
  isActive,
  onClose,
  onDone,
}: {
  userId: number;
  name: string;
  email: string;
  isActive: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        isActive ? `/api/admin/users/${userId}/deactivate` : `/api/admin/users/${userId}/activate`,
        isActive
          ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: reason.trim() }) }
          : { method: 'POST' },
      );
      // These endpoints return 204 with no body — never parse unconditionally.
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || (isActive ? 'Could not deactivate the account.' : 'Could not reactivate the account.'));
        return;
      }
      onDone();
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-brand-dark">{isActive ? 'Deactivate account' : 'Reactivate account'}</h2>

        {isActive ? (
          <div className="mt-1">
            <p className="text-sm text-gray-500">
              {name} ({email})
            </p>
            <label htmlFor="deactivation-reason" className="block text-sm font-medium text-brand-dark mt-4">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="deactivation-reason"
              rows={3}
              className={`${inputCls} mt-1`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this account being deactivated?"
              disabled={submitting}
            />
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-bold">Deactivating this account means:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>They will be signed out immediately and cannot log in.</li>
                <li>New shipments for this client from the Google Sheet will be REJECTED.</li>
                <li>Existing shipments keep receiving status updates.</li>
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mt-1">
            {name} ({email}) will be able to sign in again.
          </p>
        )}

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || (isActive && !reason.trim())}
            className={
              isActive
                ? 'px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50'
                : 'px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral disabled:opacity-50'
            }
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <BrandDots /> {isActive ? 'Deactivating…' : 'Reactivating…'}
              </span>
            ) : isActive ? (
              'Deactivate'
            ) : (
              'Reactivate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
