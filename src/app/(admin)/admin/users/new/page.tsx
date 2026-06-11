'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ClientForm from '@/components/admin/ClientForm';

export default function AdminNewUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/admin/users/${d.id}`);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
