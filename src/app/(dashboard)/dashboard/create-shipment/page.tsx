'use client';

import { useState } from 'react';
import Link from 'next/link';

const SCOPES = ['DOMESTIC', 'INTERNATIONAL'];
const TYPES = ['COMMERCIAL', 'NON-COMMERCIAL'];
const MODES = ['EXPRESS', 'AIR', 'SURFACE', 'ECO-GROUND'];
const CATEGORIES = ['DOC', 'NON-DOC'];

interface FormState {
  scope: string;
  pickupAddress: string;
  pickupPincode: string;
  pickupContactPerson: string;
  pickupContactNo: string;
  pickupContactEmail: string;
  noOfPieces: string;
  weightKg: string;
  dimensions: string;
  deliveryAddress: string;
  deliveryPincode: string;
  deliveryContactPerson: string;
  deliveryContactNo: string;
  deliveryContactEmail: string;
  shipmentType: string;
  mode: string;
  shipmentCategory: string;
  isDg: boolean;
  additionalInfo: string;
  customerRef: string;
}

const INITIAL: FormState = {
  scope: 'DOMESTIC',
  pickupAddress: '',
  pickupPincode: '',
  pickupContactPerson: '',
  pickupContactNo: '',
  pickupContactEmail: '',
  noOfPieces: '1',
  weightKg: '',
  dimensions: '',
  deliveryAddress: '',
  deliveryPincode: '',
  deliveryContactPerson: '',
  deliveryContactNo: '',
  deliveryContactEmail: '',
  shipmentType: 'COMMERCIAL',
  mode: 'SURFACE',
  shipmentCategory: 'DOC',
  isDg: false,
  additionalInfo: '',
  customerRef: '',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const labelCls = 'text-sm font-medium text-brand-dark';

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/[-\s]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('-');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function CreateShipmentPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ awb: string | null; id: number } | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      scope: form.scope,
      pickupAddress: form.pickupAddress,
      pickupPincode: form.pickupPincode,
      pickupContactPerson: form.pickupContactPerson,
      pickupContactNo: form.pickupContactNo,
      pickupContactEmail: form.pickupContactEmail,
      noOfPieces: Number(form.noOfPieces) || 0,
      weightKg: Number(form.weightKg) || 0,
      dimensions: form.dimensions,
      deliveryAddress: form.deliveryAddress,
      deliveryPincode: form.deliveryPincode,
      deliveryContactPerson: form.deliveryContactPerson,
      deliveryContactNo: form.deliveryContactNo,
      deliveryContactEmail: form.deliveryContactEmail,
      shipmentType: form.shipmentType,
      mode: form.mode,
      shipmentCategory: form.shipmentCategory,
      isDg: form.isDg,
      additionalInfo: form.additionalInfo,
      customerRef: form.customerRef,
    };

    try {
      const res = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create the shipment. Please try again.');
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
          <h1 className="text-2xl font-bold text-brand-dark mt-4">Shipment booked</h1>
          <p className="text-gray-500 mt-1">Your shipment is created. Track it with this AWB:</p>
          <div className="mt-4 inline-block bg-gray-50 border border-gray-200 rounded-lg px-5 py-3 text-2xl font-bold text-brand-orange tracking-wide">
            {created.awb ?? `#${created.id}`}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link
              href="/dashboard/shipments"
              className="px-6 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors"
            >
              View My Shipments
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setForm(INITIAL);
                setError(null);
              }}
              className="px-6 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Create Shipment</h1>
          <p className="text-gray-500 mt-1">
            Enter the booking details. An AWB is assigned automatically; billing and pickup are handled by our team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/create-shipment/bulk"
            className="px-4 py-2 text-sm font-semibold text-brand-orange border border-brand-orange rounded-lg hover:bg-orange-50 transition-colors whitespace-nowrap"
          >
            Bulk Create
          </Link>
          <Link
            href="/dashboard/shipments"
            className="hidden sm:inline text-sm font-semibold text-brand-gray hover:text-brand-orange transition-colors whitespace-nowrap"
          >
            ← My Shipments
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6">
        {/* Shipment scope */}
        <Section title="Shipment">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="scope">Scope</label>
            <select id="scope" className={inputCls} value={form.scope} onChange={(e) => set('scope', e.target.value)}>
              {SCOPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="shipmentType">Shipment Type</label>
            <select id="shipmentType" className={inputCls} value={form.shipmentType} onChange={(e) => set('shipmentType', e.target.value)}>
              {TYPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="mode">Mode</label>
            <select id="mode" className={inputCls} value={form.mode} onChange={(e) => set('mode', e.target.value)}>
              {MODES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="shipmentCategory">Category</label>
            <select id="shipmentCategory" className={inputCls} value={form.shipmentCategory} onChange={(e) => set('shipmentCategory', e.target.value)}>
              {CATEGORIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls} htmlFor="customerRef">Your reference (optional)</label>
            <input id="customerRef" className={inputCls} value={form.customerRef} onChange={(e) => set('customerRef', e.target.value)} placeholder="e.g. PO / order number — shown on your shipments" />
          </div>
          <label className="flex items-center gap-2.5 sm:col-span-2 mt-1">
            <input
              type="checkbox"
              checked={form.isDg}
              onChange={(e) => set('isDg', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
            />
            <span className="text-sm text-brand-dark">This is a dangerous goods (DG) shipment</span>
          </label>
        </Section>

        {/* Pickup */}
        <Section title="Pickup details">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls} htmlFor="pickupAddress">Pickup address <span className="text-red-500">*</span></label>
            <textarea id="pickupAddress" required rows={2} className={inputCls} value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="pickupPincode">Pincode / ZIP <span className="text-red-500">*</span></label>
            <input id="pickupPincode" required className={inputCls} value={form.pickupPincode} onChange={(e) => set('pickupPincode', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="pickupContactNo">Contact number <span className="text-red-500">*</span></label>
            <input id="pickupContactNo" required inputMode="tel" className={inputCls} value={form.pickupContactNo} onChange={(e) => set('pickupContactNo', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="pickupContactPerson">Contact person</label>
            <input id="pickupContactPerson" className={inputCls} value={form.pickupContactPerson} onChange={(e) => set('pickupContactPerson', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="pickupContactEmail">Contact email</label>
            <input id="pickupContactEmail" type="email" className={inputCls} value={form.pickupContactEmail} onChange={(e) => set('pickupContactEmail', e.target.value)} />
          </div>
        </Section>

        {/* Delivery */}
        <Section title="Delivery details">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls} htmlFor="deliveryAddress">Delivery address <span className="text-red-500">*</span></label>
            <textarea id="deliveryAddress" required rows={2} className={inputCls} value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="deliveryPincode">Pincode / ZIP <span className="text-red-500">*</span></label>
            <input id="deliveryPincode" required className={inputCls} value={form.deliveryPincode} onChange={(e) => set('deliveryPincode', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="deliveryContactNo">Contact number <span className="text-red-500">*</span></label>
            <input id="deliveryContactNo" required inputMode="tel" className={inputCls} value={form.deliveryContactNo} onChange={(e) => set('deliveryContactNo', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="deliveryContactPerson">Contact person</label>
            <input id="deliveryContactPerson" className={inputCls} value={form.deliveryContactPerson} onChange={(e) => set('deliveryContactPerson', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="deliveryContactEmail">Contact email</label>
            <input id="deliveryContactEmail" type="email" className={inputCls} value={form.deliveryContactEmail} onChange={(e) => set('deliveryContactEmail', e.target.value)} />
          </div>
        </Section>

        {/* Parcel */}
        <Section title="Parcel">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="noOfPieces">No. of pieces <span className="text-red-500">*</span></label>
            <input id="noOfPieces" required type="number" min="1" step="1" className={inputCls} value={form.noOfPieces} onChange={(e) => set('noOfPieces', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelCls} htmlFor="weightKg">Weight (kg) <span className="text-red-500">*</span></label>
            <input id="weightKg" required type="number" min="0" step="0.001" className={inputCls} value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls} htmlFor="dimensions">Dimensions (cm)</label>
            <input id="dimensions" placeholder="e.g. 30×20×15" className={inputCls} value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} />
          </div>
        </Section>

        {/* Additional */}
        <Section title="Additional information">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className={labelCls} htmlFor="additionalInfo">Notes</label>
            <textarea id="additionalInfo" rows={3} className={inputCls} value={form.additionalInfo} onChange={(e) => set('additionalInfo', e.target.value)} />
          </div>
        </Section>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link href="/dashboard" className="px-5 py-2.5 text-sm font-semibold text-brand-gray hover:text-brand-dark transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating…' : 'Create shipment'}
          </button>
        </div>
      </form>
    </div>
  );
}
