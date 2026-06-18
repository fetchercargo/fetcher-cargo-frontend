'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BrandLoader from '@/components/BrandLoader';

interface TrackingUpdate {
  date: string;
  time: string;
  text: string;
  sortOrder: number;
}

interface ShipmentDetail {
  id: number;
  awb: string | null;
  clientCode: string | null;
  customerRef: string | null;
  status: string;
  scope: string | null;
  shipmentType: string | null;
  mode: string | null;
  shipmentCategory: string | null;
  isDg: boolean;
  batchNo: string | null;
  pickupAddress: string | null;
  pickupPincode: string | null;
  pickupContactPerson: string | null;
  pickupContactNo: string | null;
  pickupContactEmail: string | null;
  pickupAltContactPerson: string | null;
  pickupAltContactNo: string | null;
  noOfPieces: number | null;
  weightKg: number | null;
  dimensions: string | null;
  chargeableWeight: number | null;
  parcels: { noOfPieces: number | null; weightKg: number | null; dimensions: string | null }[] | null;
  deliveryAddress: string | null;
  deliveryPincode: string | null;
  deliveryContactPerson: string | null;
  deliveryContactNo: string | null;
  deliveryContactEmail: string | null;
  deliveryAltContactPerson: string | null;
  deliveryAltContactNo: string | null;
  estimatedDeliveryDate: string | null;
  billingAmount: number | null;
  additionalInfo: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  updates: TrackingUpdate[];
}

function statusClasses(status: string): string {
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700';
  if (status === 'CANCELLED' || status === 'RTO') return 'bg-red-100 text-red-700';
  if (status === 'ISSUE/DELAYED') return 'bg-amber-100 text-amber-700';
  return 'bg-purple-100 text-brand-purple';
}

function titleCase(s: string | null): string {
  if (!s) return '—';
  return s
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === '';
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-brand-dark mt-0.5 break-words">{empty ? '—' : value}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">{children}</dl>
    </div>
  );
}

export default function ShipmentDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<ShipmentDetail | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    fetch(`/api/shipments/${id}`)
      .then(async (res) => {
        if (!active) return;
        if (res.status === 404) {
          setState('notfound');
          return;
        }
        if (!res.ok) {
          setState('error');
          return;
        }
        setData((await res.json()) as ShipmentDetail);
        setState('ok');
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [id]);

  const back = (
    <Link href="/dashboard/shipments" className="text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors">
      ← My Shipments
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

  if (state === 'notfound' || state === 'error' || !data) {
    return (
      <div className="max-w-5xl mx-auto">
        {back}
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center mt-4">
          <p className="text-brand-dark font-medium">
            {state === 'notfound' ? 'Shipment not found' : 'Could not load this shipment'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {state === 'notfound'
              ? "It may not exist, or it isn't on your account."
              : 'Please try again in a moment.'}
          </p>
        </div>
      </div>
    );
  }

  const updates = data.updates.filter((u) => u.text && u.text.trim());

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        {back}
      </div>

      {/* Header */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">{data.awb || `#${data.id}`}</h1>
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusClasses(data.status)}`}>
          {data.status}
        </span>
        {data.isDg && (
          <span className="text-[11px] font-semibold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">DG</span>
        )}
      </div>
      <p className="text-gray-500 text-sm mt-1">Booked {fmtDateTime(data.createdAt)}</p>

      <div className="grid grid-cols-1 gap-4 mt-6">
        <Section title="Overview">
          <Row label="AWB" value={data.awb} />
          <Row label="Client ID" value={data.clientCode} />
          <Row label="Your Reference" value={data.customerRef} />
          <Row label="Status" value={data.status} />
          <Row label="Scope" value={titleCase(data.scope)} />
          <Row label="Shipment Type" value={titleCase(data.shipmentType)} />
          <Row label="Mode" value={titleCase(data.mode)} />
          <Row label="Category" value={titleCase(data.shipmentCategory)} />
          <Row label="Dangerous Goods" value={data.isDg ? 'Yes' : 'No'} />
        </Section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section title="Pickup">
            <div className="sm:col-span-2">
              <Row label="Address" value={data.pickupAddress} />
            </div>
            <Row label="Pincode / ZIP" value={data.pickupPincode} />
            <Row label="Contact No." value={data.pickupContactNo} />
            <Row label="Contact Person" value={data.pickupContactPerson} />
            <Row label="Contact Email" value={data.pickupContactEmail} />
            <Row label="Alt. Contact Person" value={data.pickupAltContactPerson} />
            <Row label="Alt. Contact No." value={data.pickupAltContactNo} />
          </Section>

          <Section title="Delivery">
            <div className="sm:col-span-2">
              <Row label="Address" value={data.deliveryAddress} />
            </div>
            <Row label="Pincode / ZIP" value={data.deliveryPincode} />
            <Row label="Contact No." value={data.deliveryContactNo} />
            <Row label="Contact Person" value={data.deliveryContactPerson} />
            <Row label="Contact Email" value={data.deliveryContactEmail} />
            <Row label="Alt. Contact Person" value={data.deliveryAltContactPerson} />
            <Row label="Alt. Contact No." value={data.deliveryAltContactNo} />
          </Section>
        </div>

        <Section title="Parcels">
          <Row label="Total Pieces" value={data.noOfPieces} />
          <Row label="Total Weight" value={data.weightKg != null ? `${data.weightKg} kg` : null} />
          <Row label="Chargeable Weight" value={data.chargeableWeight != null ? `${data.chargeableWeight} kg` : null} />
          {(data.parcels ?? []).map((p, i) => (
            <div key={i} className="sm:col-span-2">
              <Row
                label={`Parcel ${i + 1}`}
                value={`${p.noOfPieces ?? '—'} pcs · ${p.weightKg != null ? `${p.weightKg} kg` : '—'}${p.dimensions ? ` · ${p.dimensions}` : ''}`}
              />
            </div>
          ))}
        </Section>

        <Section title="Commercial & Ops">
          <Row label="Estimated Delivery" value={data.estimatedDeliveryDate} />
          <Row label="Billing Amount" value={data.billingAmount != null ? `₹${data.billingAmount}` : null} />
          <Row label="Batch No." value={data.batchNo} />
          <Row label="Remarks" value={data.remarks} />
          <div className="sm:col-span-2">
            <Row label="Additional Information" value={data.additionalInfo} />
          </div>
        </Section>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
          <h2 className="text-base font-semibold text-brand-dark">Tracking timeline</h2>
          {updates.length === 0 ? (
            <p className="text-gray-400 text-sm mt-3">No tracking updates yet.</p>
          ) : (
            <div className="relative mt-5 pl-6 border-l-2 border-gray-200 space-y-5">
              {updates.map((u, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                  <div className="text-xs text-gray-500">
                    {u.date}
                    {u.time ? ` · ${u.time}` : ''}
                  </div>
                  <div className="text-sm text-brand-dark font-medium mt-0.5">{u.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
