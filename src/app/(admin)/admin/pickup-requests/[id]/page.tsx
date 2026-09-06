'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatBytes, formatDateTime } from '@/lib/admin';
import { badgeClasses, statusMap } from '@/lib/status';
import {
  FALLBACK_PICKUP_STATUSES,
  fetchPickupStatuses,
  pickupFileUrl,
  setPickupRequestStatus,
  type PickupRequest,
  type PickupRequestFile,
  type PickupStatus,
} from '@/lib/pickup';
import BrandLoader from '@/components/BrandLoader';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

// One attachment tile, used wherever a photo renders: opens the streamed
// bytes (Drive or held Postgres) in a new tab.
function FileTile({ requestId, file }: { requestId: number; file: PickupRequestFile }) {
  return (
    <a
      href={pickupFileUrl(requestId, file.id)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${file.fileName} (${formatBytes(file.sizeBytes)})`}
      className="group block rounded-lg border border-gray-200 overflow-hidden hover:border-brand-orange transition-colors"
    >
      {file.mimeType.startsWith('image/') ? (
        // eslint-disable-next-line @next/next/no-img-element -- streams from the API behind the session cookie, which the next/image optimizer cannot forward
        <img src={pickupFileUrl(requestId, file.id)} alt={file.fileName} className="w-full aspect-square object-cover" />
      ) : (
        <span className="w-full aspect-square bg-gray-50 flex flex-col items-center justify-center gap-1 text-gray-400">
          <FileIcon />
          <span className="text-[10px] font-semibold uppercase tracking-wide">PDF</span>
        </span>
      )}
      <span className="block px-2 py-1.5 text-[11px] text-gray-500 truncate">{file.fileName}</span>
    </a>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-brand-dark font-medium break-words">{children}</dd>
    </div>
  );
}

export default function AdminPickupRequestDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<PickupRequest | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [statuses, setStatuses] = useState<PickupStatus[]>(FALLBACK_PICKUP_STATUSES);
  const statusColors = statusMap(statuses);
  const [statusDraft, setStatusDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetchPickupStatuses().then(setStatuses);
  }, []);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/pickup-requests/${id}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) { setState('notfound'); return; }
        if (!res.ok) { setState('error'); return; }
        setData((await res.json()) as PickupRequest);
        setState('ok');
      })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [id]);

  // The status select can only mount its draft once the request has loaded, so
  // it syncs here. Deferred to a microtask only to satisfy the repo's
  // react-hooks/set-state-in-effect lint rule (same note as the shipments grid).
  useEffect(() => {
    if (!data) return;
    queueMicrotask(() => setStatusDraft(data.status));
  }, [data]);

  async function saveStatus() {
    if (!data || savingStatus) return;
    setSavingStatus(true);
    setError(null);
    setNotice(null);
    try {
      const res = await setPickupRequestStatus(data.id, statusDraft);
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(d.error || 'Could not update the status.');
        return;
      }
      // The PUT returns only {ok}; carry the chosen status into the local copy
      // so the header badge follows without a refetch.
      setData({ ...data, status: statusDraft });
      setNotice('Status updated.');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  }

  const back = (
    <Link href="/admin/pickup-requests" className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
      ← All pickup requests
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
  if (state !== 'ok' || !data) {
    return (
      <div className="max-w-4xl mx-auto">
        {back}
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-brand-dark font-medium">{state === 'notfound' ? 'Pickup request not found' : 'Could not load this pickup request'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {back}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">{data.ref}</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${badgeClasses(statusColors[data.status]?.color ?? 'purple')}`}>
          {statusColors[data.status]?.label ?? data.status}
        </span>
        {/* Claimed, not proven: the OTP shows control of the mailbox, not of
            this Customer ID. */}
        {!data.customerMatched && (
          <span className="text-[11px] font-semibold uppercase bg-amber-100 text-amber-700 px-2 py-0.5 rounded">unverified ID</span>
        )}
      </div>
      <p className="text-gray-500 text-sm mt-1">
        Customer: <span className="font-medium text-brand-dark">{data.customerId}</span>
        {' · '}
        <span className="font-medium text-brand-dark">{data.email}</span>
      </p>

      {notice && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{notice}</div>}
      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-brand-dark">Request</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Customer ID">{data.customerId}</Field>
            <Field label="Email">{data.email}</Field>
            <Field label="Shipments">{data.awbCount}</Field>
            <Field label="Ready at">{formatDateTime(data.readyAt)}</Field>
            <Field label="Submitted">{formatDateTime(data.createdAt)}</Field>
            <Field label="Verified">{data.verifiedAt ? formatDateTime(data.verifiedAt) : '—'}</Field>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-brand-dark">Pickup address</h2>
          {data.pickupLocation ? (
            /* The saved location expanded — the public form only ever saw its
                label, so this block is where ops learn where to send the van. */
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Saved location</dt>
                <dd className="mt-0.5 text-sm text-brand-dark font-medium">{data.pickupLocation.label}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Address</dt>
                <dd className="mt-0.5 text-sm text-brand-dark font-medium">{data.pickupLocation.address}</dd>
              </div>
              <Field label="City">{data.pickupLocation.city}</Field>
              <Field label="Pincode">{data.pickupLocation.pincode}</Field>
              <Field label="Contact person">{data.pickupLocation.contactPerson || '—'}</Field>
              <Field label="Contact number">{data.pickupLocation.contactNo || '—'}</Field>
            </dl>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="col-span-2">
                <dt className="text-[11px] uppercase tracking-wide text-gray-400">Typed address</dt>
                <dd className="mt-0.5 text-sm text-brand-dark font-medium">{data.address || '—'}</dd>
              </div>
              <Field label="City">{data.city || '—'}</Field>
              <Field label="State">{data.state || '—'}</Field>
              <Field label="Pincode">{data.pincode || '—'}</Field>
            </dl>
          )}
        </section>
      </div>

      <section className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-brand-dark">Pickup status</h2>
        <div className="mt-3 flex flex-col sm:flex-row gap-2.5">
          <select className={inputCls} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
            {statuses
              .filter((s) => s.isActive || s.code === data.status)
              .map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
          </select>
          <button
            type="button"
            onClick={saveStatus}
            disabled={savingStatus || !statusDraft || statusDraft === data.status}
            className="px-4 py-2 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {savingStatus ? 'Updating…' : 'Update status'}
          </button>
        </div>
      </section>

      <section className="mt-4 mb-8 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-brand-dark">AWBs &amp; images</h2>
        <p className="text-xs text-gray-400 mt-1">
          Photos are optional per shipment — an AWB showing no image is a box to chase.
        </p>
        {data.awbs.length === 0 ? (
          <p className="text-sm text-gray-400 mt-3">No AWBs recorded.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {[...data.awbs].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => {
              const mine = data.files.filter((f) => f.awbId !== null && f.awbId === a.id);
              return (
                <div key={a.sortOrder} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-mono text-brand-dark">
                      <span className="text-gray-400 mr-2">{a.sortOrder}.</span>
                      {a.awb}
                    </span>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {mine.length} photo{mine.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  {mine.length > 0 ? (
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {mine.map((f) => <FileTile key={f.id} requestId={data.id} file={f} />)}
                    </div>
                  ) : (
                    // The visibly EMPTY state is the useful information: photos
                    // are optional, so the gap is what ops act on.
                    <p className="mt-2 inline-block text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      No image attached
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Attachments that belong to the request rather than a box: rows from
            before the per-AWB change, or the bare-files compatibility field.
            Rendered apart from the boxes because they belong to none of them. */}
        {data.files.some((f) => f.awbId === null) && (
          <div className="mt-3 border border-dashed border-gray-300 rounded-lg p-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Attached without an AWB
            </span>
            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {data.files.filter((f) => f.awbId === null).map((f) => (
                <FileTile key={f.id} requestId={data.id} file={f} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
