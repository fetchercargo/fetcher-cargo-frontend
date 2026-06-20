'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ClientForm, { type ClientFormState } from '@/components/admin/ClientForm';
import { emptyLocation, type ClientDetail, type ClientLocation } from '@/lib/admin';
import BrandLoader from '@/components/BrandLoader';

function toInput(l: ClientLocation) {
  return {
    label: l.label,
    address: l.address,
    city: l.city,
    state: l.state,
    pincode: l.pincode,
    contactNo: l.contactNo,
    email: l.email,
    contactPerson: l.contactPerson,
    altContactPerson: l.altContactPerson,
    altContactNo: l.altContactNo,
  };
}

function detailToForm(d: ClientDetail): Partial<ClientFormState> {
  return {
    email: d.user.email,
    name: d.user.name,
    role: d.user.role,
    clientCode: d.user.clientCode,
    businessName: d.user.businessName,
    businessAddress: d.user.businessAddress,
    businessEmail: d.user.businessEmail,
    primaryTel: d.user.primaryTel,
    primaryContactPerson: d.user.primaryContactPerson,
    pickups: d.pickups.length ? d.pickups.map(toInput) : [emptyLocation()],
    deliveries: d.deliveries.length ? d.deliveries.map(toInput) : [emptyLocation()],
  };
}

export default function AdminEditUserPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/users/${id}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) return setState('notfound');
        if (!res.ok) return setState('error');
        setDetail((await res.json()) as ClientDetail);
        setState('ok');
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit(payload: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not save changes.');
        return;
      }
      router.push(`/admin/users/${id}`);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const back = (
    <Link href={`/admin/users/${id}`} className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
      ← Back to client
    </Link>
  );

  if (state === 'loading') {
    return (
      <div className="max-w-4xl mx-auto">
        {back}
        <BrandLoader variant="section" />
      </div>
    );
  }
  if (state !== 'ok' || !detail) {
    return (
      <div className="max-w-4xl mx-auto">
        {back}
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-brand-dark font-medium">{state === 'notfound' ? 'Account not found' : 'Could not load this account'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {back}
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mt-4">Edit {detail.user.email}</h1>
      <p className="text-gray-500 mt-1">Update the account, business profile, and saved locations.</p>
      <div className="mt-6">
        <ClientForm mode="edit" initial={detailToForm(detail)} submitting={submitting} error={error} submitLabel="Save changes" onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
