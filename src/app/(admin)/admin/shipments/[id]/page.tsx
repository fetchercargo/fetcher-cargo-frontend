'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ShipmentForm, { type ShipmentFormState } from '@/components/admin/ShipmentForm';
import TrackingEditor from '@/components/admin/TrackingEditor';
import { statusClasses, type ShipmentDetail, type TrackingUpdate } from '@/lib/admin';

function detailToForm(d: ShipmentDetail): Partial<ShipmentFormState> {
  const s = (v: string | null) => v ?? '';
  const n = (v: number | null) => (v == null ? '' : String(v));
  return {
    scope: s(d.scope), pickupAddress: s(d.pickupAddress), pickupPincode: s(d.pickupPincode),
    pickupContactPerson: s(d.pickupContactPerson), pickupContactNo: s(d.pickupContactNo), pickupContactEmail: s(d.pickupContactEmail),
    noOfPieces: n(d.noOfPieces), weightKg: n(d.weightKg), dimensions: s(d.dimensions),
    deliveryAddress: s(d.deliveryAddress), deliveryPincode: s(d.deliveryPincode),
    deliveryContactPerson: s(d.deliveryContactPerson), deliveryContactNo: s(d.deliveryContactNo), deliveryContactEmail: s(d.deliveryContactEmail),
    shipmentType: s(d.shipmentType), mode: s(d.mode), shipmentCategory: s(d.shipmentCategory),
    isDg: d.isDg, additionalInfo: s(d.additionalInfo), customerRef: s(d.customerRef),
    awb: s(d.awb), status: d.status, batchNo: s(d.batchNo), chargeableWeight: n(d.chargeableWeight),
    estimatedDeliveryDate: s(d.estimatedDeliveryDate), billingAmount: n(d.billingAmount), remarks: s(d.remarks),
  };
}

export default function AdminEditShipmentPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<ShipmentDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');
  const [saving, setSaving] = useState(false);
  const [savingTrack, setSavingTrack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/admin/shipments/${id}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) { setState('notfound'); return; }
        if (!res.ok) { setState('error'); return; }
        setData((await res.json()) as ShipmentDetail);
        setState('ok');
      })
      .catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [id]);

  async function handleSave(payload: Record<string, unknown>) {
    setSaving(true); setError(null); setNotice(null);
    try {
      const res = await fetch(`/api/admin/shipments/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || 'Could not save changes.'); return; }
      setData(d as ShipmentDetail); setNotice('Changes saved.');
    } catch { setError('Unable to connect. Please try again.'); } finally { setSaving(false); }
  }

  async function handleTracking(updates: TrackingUpdate[]) {
    setSavingTrack(true); setError(null); setNotice(null);
    try {
      const res = await fetch(`/api/admin/shipments/${id}/tracking`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || 'Could not save the timeline.'); return; }
      setData(d as ShipmentDetail); setNotice('Timeline saved.');
    } catch { setError('Unable to connect. Please try again.'); } finally { setSavingTrack(false); }
  }

  const back = (
    <Link href="/admin/shipments" className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
      ← All shipments
    </Link>
  );

  if (state === 'loading') {
    return (
      <div className="max-w-4xl mx-auto">
        {back}
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-7 w-7 text-brand-orange" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }
  if (state !== 'ok' || !data) {
    return (
      <div className="max-w-4xl mx-auto">
        {back}
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-brand-dark font-medium">{state === 'notfound' ? 'Shipment not found' : 'Could not load this shipment'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {back}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">{data.awb || `#${data.id}`}</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(data.status)}`}>{data.status}</span>
        {data.isDg && <span className="text-[11px] font-semibold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">DG</span>}
      </div>
      <p className="text-gray-500 text-sm mt-1">
        Client: <span className="font-medium text-brand-dark">{data.clientCode || '—'}</span>
        {data.customerRef ? ` · Ref: ${data.customerRef}` : ''}
      </p>

      {notice && <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{notice}</div>}

      <div className="mt-6">
        <ShipmentForm key={data.updatedAt} mode="edit" initial={detailToForm(data)} submitting={saving} error={error} submitLabel="Save changes" onSubmit={handleSave} />
      </div>

      <div className="mt-4">
        <TrackingEditor key={`trk-${data.updatedAt}`} initial={data.updates} saving={savingTrack} onSave={handleTracking} />
      </div>
    </div>
  );
}
