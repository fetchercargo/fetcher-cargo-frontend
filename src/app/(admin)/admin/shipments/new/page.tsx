'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ShipmentForm from '@/components/admin/ShipmentForm';
import type { ClientOption } from '@/lib/admin';

export default function AdminNewShipmentPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ awb: string | null; id: number } | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    fetch('/api/admin/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setClients(d as ClientOption[]))
      .catch(() => setClients([]));
  }, []);

  async function handleSubmit(payload: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create the shipment.');
        return;
      }
      setCreated({ awb: data.awb ?? null, id: data.id });
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
          <h1 className="text-2xl font-bold text-brand-dark mt-4">Shipment created</h1>
          <p className="text-gray-500 mt-1">AWB:</p>
          <div className="mt-3 inline-block bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-2xl font-bold text-brand-orange tracking-wide">
            {created.awb ?? `#${created.id}`}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href={`/admin/shipments/${created.id}`} className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
              Open shipment
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setFormKey((k) => k + 1);
              }}
              className="px-6 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors"
            >
              Create another
            </button>
            <Link href="/admin/shipments" className="px-6 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
              All shipments
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Create shipment for a client</h1>
          <p className="text-gray-500 mt-1">Pick the client, fill the booking. An AWB is assigned automatically.</p>
        </div>
        <Link href="/admin/shipments" className="hidden sm:inline text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors whitespace-nowrap">
          ← All shipments
        </Link>
      </div>
      <div className="mt-6">
        <ShipmentForm key={formKey} mode="create" clients={clients} submitting={submitting} error={error} submitLabel="Create shipment" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
