'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatDate, type AdminShipmentListItem, type ClientDetail, type ClientLocation } from '@/lib/admin';
import { fetchStatuses, badgeClasses, statusMap, FALLBACK_STATUSES, type StatusConfig } from '@/lib/status';
import BrandLoader from '@/components/BrandLoader';
import DocumentManager from '@/components/admin/DocumentManager';
import ResetPasswordModal from '@/components/admin/ResetPasswordModal';

function initials(name: string, email: string): string {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-brand-dark mt-0.5 break-words">{value || '—'}</dd>
    </div>
  );
}

function LocationCard({ title, locations }: { title: string; locations: ClientLocation[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-brand-dark mb-3">
        {title} <span className="text-gray-400 font-normal">({locations.length})</span>
      </h3>
      {locations.length === 0 ? (
        <p className="text-sm text-gray-400">None.</p>
      ) : (
        <ul className="space-y-3">
          {locations.map((l) => (
            <li key={l.id} className="text-sm border border-gray-100 rounded-lg p-3 bg-gray-50/50">
              <p className="font-medium text-brand-dark">{l.label}</p>
              <p className="text-gray-600 mt-0.5">
                {[l.address, l.city, l.state, l.pincode].filter(Boolean).join(', ')}
              </p>
              {(l.contactPerson || l.contactNo || l.email) && (
                <p className="text-gray-400 text-xs mt-1">{[l.contactPerson, l.contactNo, l.email].filter(Boolean).join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminViewUserPage() {
  const params = useParams();
  const id = String(params.id);
  const [d, setD] = useState<ClientDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [shipments, setShipments] = useState<AdminShipmentListItem[] | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [statuses, setStatuses] = useState<StatusConfig[]>(FALLBACK_STATUSES);
  const statusColors = statusMap(statuses);

  useEffect(() => {
    fetchStatuses().then(setStatuses);
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/users/${id}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) return setState('notfound');
        if (!res.ok) return setState('error');
        const detail = (await res.json()) as ClientDetail;
        setD(detail);
        setState('ok');
        if (detail.user.clientCode) {
          fetch(`/api/admin/shipments?client=${encodeURIComponent(detail.user.clientCode)}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((s) => active && setShipments(s as AdminShipmentListItem[]))
            .catch(() => active && setShipments([]));
        } else {
          setShipments([]);
        }
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [id]);

  const back = (
    <Link href="/admin/users" className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
      ← Users &amp; clients
    </Link>
  );

  if (state === 'loading') {
    return (
      <div className="max-w-5xl mx-auto">
        {back}
        <BrandLoader variant="section" />
      </div>
    );
  }
  if (state !== 'ok' || !d) {
    return (
      <div className="max-w-5xl mx-auto">
        {back}
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-brand-dark font-medium">{state === 'notfound' ? 'Account not found' : 'Could not load this account'}</p>
        </div>
      </div>
    );
  }

  const u = d.user;
  const isClient = u.role === 'user';

  return (
    <div className="max-w-5xl mx-auto">
      {back}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-brand-light-gray text-brand-purple font-bold flex items-center justify-center">{initials(u.name, u.email)}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-brand-dark">{u.name || u.email}</h1>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-brand-purple text-white' : 'bg-gray-100 text-gray-600'}`}>
                {u.role === 'admin' ? 'Admin' : 'Client'}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {u.email}
              {isClient && u.clientCode ? ` · ${u.clientCode}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isClient && u.clientCode && (
            <Link href={`/admin/shipments?client=${encodeURIComponent(u.clientCode)}`} className="px-4 py-2 text-sm font-semibold text-brand-gray border border-gray-200 rounded-lg hover:text-brand-dark hover:border-gray-300 transition-colors">
              View shipments
            </Link>
          )}
          <button onClick={() => setResetOpen(true)} className="px-4 py-2 text-sm font-semibold text-brand-gray border border-gray-200 rounded-lg hover:text-brand-dark hover:border-gray-300 transition-colors">
            Reset password
          </button>
          <Link href={`/admin/users/${id}/edit`} className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors">
            Edit
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-brand-dark mb-4">{isClient ? 'Business profile' : 'Account'}</h3>
          <dl className="grid grid-cols-2 gap-4">
            {isClient && <Detail label="Business name" value={u.businessName} />}
            {isClient && <Detail label="Business email" value={u.businessEmail} />}
            {isClient && <Detail label="Primary tel" value={u.primaryTel} />}
            {isClient && <Detail label="Primary contact" value={u.primaryContactPerson} />}
            {isClient && (
              <div className="col-span-2">
                <Detail label="Address" value={u.businessAddress} />
              </div>
            )}
            <Detail label="Login email" value={u.email} />
            <Detail label="Client code" value={u.clientCode} />
            <Detail label="Created" value={formatDate(u.createdAt)} />
          </dl>
        </div>

        {isClient && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-brand-dark mb-3">
              Recent shipments {shipments && <span className="text-gray-400 font-normal">({shipments.length})</span>}
            </h3>
            {shipments === null ? (
              <BrandLoader variant="section" />
            ) : shipments.length === 0 ? (
              <p className="text-sm text-gray-400">No shipments yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {shipments.slice(0, 6).map((s) => (
                  <li key={s.id} className="py-2 flex items-center justify-between gap-3">
                    <Link href={`/admin/shipments/${s.id}`} className="text-sm font-medium text-brand-dark hover:text-brand-orange transition-colors truncate">
                      {s.awb || `#${s.id}`}
                    </Link>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${badgeClasses(statusColors[s.status]?.color ?? 'purple')}`}>{statusColors[s.status]?.label ?? s.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {isClient && (
        <>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LocationCard title="Pickup locations" locations={d.pickups} />
            <LocationCard title="Delivery locations" locations={d.deliveries} />
          </div>
          {u.clientCode && (
            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DocumentManager category="documents" title="Documents" clientCode={u.clientCode} nested />
              <DocumentManager category="billing" title="Billing" clientCode={u.clientCode} />
            </div>
          )}
        </>
      )}

      {resetOpen && <ResetPasswordModal userId={u.id} email={u.email} onClose={() => setResetOpen(false)} />}
    </div>
  );
}
