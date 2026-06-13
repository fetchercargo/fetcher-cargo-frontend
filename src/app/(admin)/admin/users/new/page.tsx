'use client';

import { useState } from 'react';
import Link from 'next/link';
import ClientForm from '@/components/admin/ClientForm';

interface Created {
  id: number;
  name: string;
  email: string;
  tempPassword: string;
  emailed: boolean;
}

export default function AdminNewUserPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(payload: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not create the account.');
        return;
      }
      setCreated({ id: d.user.id, name: d.user.name, email: d.user.email, tempPassword: d.tempPassword, emailed: d.emailed });
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function copy() {
    if (!created) return;
    navigator.clipboard?.writeText(created.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (created) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-brand-dark mt-4">Client onboarded</h1>
          <p className="text-gray-500 mt-1">{created.name} can now sign in.</p>

          <div className="mt-6 text-left">
            <p className="text-xs text-gray-400 mb-1">Temporary password</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg text-brand-dark tracking-wide break-all">{created.tempPassword}</code>
              <button onClick={copy} className="px-3 py-3 text-sm font-semibold text-brand-orange border border-gray-200 rounded-lg hover:border-brand-orange transition-colors whitespace-nowrap">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className={`text-sm mt-3 ${created.emailed ? 'text-green-700' : 'text-amber-700'}`}>
              {created.emailed
                ? `We emailed the temporary password to ${created.email}.`
                : `Email is not configured — share this temporary password with the client securely.`}
            </p>
            <p className="text-xs text-gray-400 mt-1">They will be asked to set their own password on first login.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href={`/admin/users/${created.id}`} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
              Open client
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setCopied(false);
              }}
              className="px-6 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors"
            >
              Onboard another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/admin/users" className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
        ← Users &amp; clients
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mt-4">Onboard client</h1>
      <p className="text-gray-500 mt-1">Create the account, business profile, and saved pickup/delivery locations.</p>
      <div className="mt-6">
        <ClientForm mode="create" submitting={submitting} error={error} submitLabel="Create client" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
