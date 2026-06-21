'use client';

import { useEffect, useState } from 'react';
import { SCOPES, TYPES, MODES, CATEGORIES, titleCase, type ClientLocation, type ClientOption } from '@/lib/admin';
import { fetchStatuses, FALLBACK_STATUSES, type StatusConfig } from '@/lib/status';
import { BrandDots } from '@/components/BrandLoader';
import ParcelRows, { emptyParcel, type ParcelFormState } from '@/components/admin/ParcelRows';
import PincodeNote from '@/components/PincodeNote';
import StateSelect from '@/components/StateSelect';
import { fetchPincodeAutofill } from '@/lib/pincode';

export interface ShipmentFormState {
  clientCode: string;
  scope: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  pickupContactPerson: string;
  pickupContactNo: string;
  pickupContactEmail: string;
  pickupAltContactPerson: string;
  pickupAltContactNo: string;
  parcels: ParcelFormState[];
  deliveryAddress: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryPincode: string;
  deliveryContactPerson: string;
  deliveryContactNo: string;
  deliveryContactEmail: string;
  deliveryAltContactPerson: string;
  deliveryAltContactNo: string;
  shipmentType: string;
  mode: string;
  shipmentCategory: string;
  isDg: boolean;
  additionalInfo: string;
  customerRef: string;
  // ops (edit only)
  awb: string;
  status: string;
  batchNo: string;
  chargeableWeight: string;
  estimatedDeliveryDate: string;
  billingAmount: string;
  remarks: string;
}

const DEFAULTS: ShipmentFormState = {
  clientCode: '', scope: 'DOMESTIC', pickupAddress: '', pickupCity: '', pickupState: '', pickupPincode: '', pickupContactPerson: '',
  pickupContactNo: '', pickupContactEmail: '', pickupAltContactPerson: '', pickupAltContactNo: '',
  parcels: [emptyParcel()],
  deliveryAddress: '', deliveryCity: '', deliveryState: '', deliveryPincode: '', deliveryContactPerson: '', deliveryContactNo: '', deliveryContactEmail: '',
  deliveryAltContactPerson: '', deliveryAltContactNo: '',
  shipmentType: 'COMMERCIAL', mode: 'SURFACE', shipmentCategory: 'NON-DOC', isDg: false, additionalInfo: '', customerRef: '',
  awb: '', status: 'SHIPMENT CREATED', batchNo: '', chargeableWeight: '', estimatedDeliveryDate: '', billingAmount: '', remarks: '',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const labelCls = 'text-sm font-medium text-brand-dark';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark mb-4">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// Optional helper: fills an address block from the selected client's saved
// locations. The fields stay free-text — this just pre-fills them.
function LocationPicker({ locations, onPick, label }: { locations: ClientLocation[]; onPick: (l: ClientLocation) => void; label: string }) {
  if (locations.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <label className={labelCls}>{label}</label>
      <select
        className={inputCls}
        value=""
        onChange={(e) => {
          const l = locations.find((x) => String(x.id) === e.target.value);
          if (l) onPick(l);
        }}
      >
        <option value="">Select a saved location to fill the fields…</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.label}
            {l.pincode ? ` — ${l.pincode}` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function ShipmentForm({
  mode,
  clients = [],
  initial,
  submitting,
  error,
  submitLabel,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  clients?: ClientOption[];
  initial?: Partial<ShipmentFormState>;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<ShipmentFormState>({ ...DEFAULTS, ...initial });

  function set<K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Saved locations for the selected client (create-for-client only) — used to
  // pre-fill the address blocks via the picker. Addresses remain editable.
  const [savedPickups, setSavedPickups] = useState<ClientLocation[]>([]);
  const [savedDeliveries, setSavedDeliveries] = useState<ClientLocation[]>([]);
  // Admin-managed statuses for the dropdown (active ones, plus the current value
  // even if it's been deactivated so editing an old shipment still shows it).
  const [statusList, setStatusList] = useState<StatusConfig[]>(FALLBACK_STATUSES);
  useEffect(() => {
    let alive = true;
    fetchStatuses().then((list) => {
      if (alive) setStatusList(list);
    });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (mode !== 'create' || !form.clientCode) return;
    let active = true;
    fetch(`/api/admin/clients/${encodeURIComponent(form.clientCode)}/locations`)
      .then((r) => (r.ok ? r.json() : { pickups: [], deliveries: [] }))
      .then((d) => {
        if (!active) return;
        setSavedPickups(d.pickups ?? []);
        setSavedDeliveries(d.deliveries ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [mode, form.clientCode]);

  function fillPickup(l: ClientLocation) {
    setForm((f) => ({ ...f, pickupAddress: l.address, pickupCity: l.city, pickupState: l.state, pickupPincode: l.pincode, pickupContactPerson: l.contactPerson, pickupContactNo: l.contactNo, pickupContactEmail: l.email, pickupAltContactPerson: l.altContactPerson, pickupAltContactNo: l.altContactNo }));
  }
  function fillDelivery(l: ClientLocation) {
    setForm((f) => ({ ...f, deliveryAddress: l.address, deliveryCity: l.city, deliveryState: l.state, deliveryPincode: l.pincode, deliveryContactPerson: l.contactPerson, deliveryContactNo: l.contactNo, deliveryContactEmail: l.email, deliveryAltContactPerson: l.altContactPerson, deliveryAltContactNo: l.altContactNo }));
  }

  async function autofill(which: 'pickup' | 'delivery', pincode: string) {
    if (form.scope.trim().toUpperCase() !== 'DOMESTIC') return;
    const sug = await fetchPincodeAutofill(pincode);
    if (!sug) return;
    setForm((f) =>
      which === 'pickup'
        ? { ...f, pickupCity: f.pickupCity || sug.city, pickupState: f.pickupState || sug.state }
        : { ...f, deliveryCity: f.deliveryCity || sug.city, deliveryState: f.deliveryState || sug.state },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = {
      scope: form.scope,
      pickupAddress: form.pickupAddress,
      pickupCity: form.pickupCity,
      pickupState: form.pickupState,
      pickupPincode: form.pickupPincode,
      pickupContactPerson: form.pickupContactPerson,
      pickupContactNo: form.pickupContactNo,
      pickupContactEmail: form.pickupContactEmail,
      pickupAltContactPerson: form.pickupAltContactPerson,
      pickupAltContactNo: form.pickupAltContactNo,
      parcels: form.parcels.map((p) => ({
        noOfPieces: Number(p.noOfPieces) || 0,
        weightKg: Number(p.weightKg) || 0,
        dimensions: p.dimensions,
      })),
      deliveryAddress: form.deliveryAddress,
      deliveryCity: form.deliveryCity,
      deliveryState: form.deliveryState,
      deliveryPincode: form.deliveryPincode,
      deliveryContactPerson: form.deliveryContactPerson,
      deliveryContactNo: form.deliveryContactNo,
      deliveryContactEmail: form.deliveryContactEmail,
      deliveryAltContactPerson: form.deliveryAltContactPerson,
      deliveryAltContactNo: form.deliveryAltContactNo,
      shipmentType: form.shipmentType,
      mode: form.mode,
      shipmentCategory: form.shipmentCategory,
      isDg: form.isDg,
      additionalInfo: form.additionalInfo,
      customerRef: form.customerRef,
    };
    if (mode === 'create') {
      onSubmit({ clientCode: form.clientCode, ...base });
      return;
    }
    onSubmit({
      ...base,
      awb: form.awb,
      status: form.status,
      batchNo: form.batchNo,
      chargeableWeight: form.chargeableWeight === '' ? null : Number(form.chargeableWeight),
      estimatedDeliveryDate: form.estimatedDeliveryDate,
      billingAmount: form.billingAmount === '' ? null : Number(form.billingAmount),
      remarks: form.remarks,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'create' && (
        <Section title="Client">
          <Field label="Book on behalf of" required full>
            <select className={inputCls} value={form.clientCode} onChange={(e) => set('clientCode', e.target.value)} required>
              <option value="">Select a client…</option>
              {clients.map((c) => (
                <option key={c.clientCode} value={c.clientCode}>
                  {c.name} — {c.clientCode} ({c.email})
                </option>
              ))}
            </select>
            {clients.length === 0 && <p className="text-xs text-gray-400">No clients with a code yet. Create one under Users first.</p>}
          </Field>
        </Section>
      )}

      <Section title="Shipment">
        <Field label="Scope" required>
          <select className={inputCls} value={form.scope} onChange={(e) => set('scope', e.target.value)}>
            {SCOPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </Field>
        <Field label="Shipment Type" required>
          <select className={inputCls} value={form.shipmentType} onChange={(e) => set('shipmentType', e.target.value)}>
            {TYPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </Field>
        <Field label="Mode" required>
          <select className={inputCls} value={form.mode} onChange={(e) => set('mode', e.target.value)}>
            {MODES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </Field>
        <Field label="Category" required>
          <select className={inputCls} value={form.shipmentCategory} onChange={(e) => set('shipmentCategory', e.target.value)}>
            {CATEGORIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
          </select>
        </Field>
        <Field label="Customer Reference">
          <input className={inputCls} value={form.customerRef} onChange={(e) => set('customerRef', e.target.value)} placeholder="PO / order no." />
        </Field>
        <label className="flex items-center gap-2.5 sm:col-span-2 mt-1">
          <input type="checkbox" checked={form.isDg} onChange={(e) => set('isDg', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange" />
          <span className="text-sm text-brand-dark">Dangerous goods (DG) shipment</span>
        </label>
      </Section>

      <Section title="Pickup details">
        {mode === 'create' && <LocationPicker locations={savedPickups} onPick={fillPickup} label="Use a saved pickup location" />}
        <Field label="Pickup address" required full>
          <textarea rows={2} className={inputCls} value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} />
        </Field>
        <Field label="City" required>
          <input className={inputCls} value={form.pickupCity} onChange={(e) => set('pickupCity', e.target.value)} />
        </Field>
        <Field label="State" required>
          <StateSelect className={inputCls} value={form.pickupState} onChange={(v) => set('pickupState', v)} />
        </Field>
        <Field label="Pincode / ZIP" required>
          <input className={inputCls} value={form.pickupPincode} onChange={(e) => set('pickupPincode', e.target.value)} onBlur={() => autofill('pickup', form.pickupPincode)} />
          <PincodeNote pincode={form.pickupPincode} leg="pickup" scope={form.scope} />
        </Field>
        <Field label="Contact number" required>
          <input className={inputCls} value={form.pickupContactNo} onChange={(e) => set('pickupContactNo', e.target.value)} />
        </Field>
        <Field label="Contact person">
          <input className={inputCls} value={form.pickupContactPerson} onChange={(e) => set('pickupContactPerson', e.target.value)} />
        </Field>
        <Field label="Contact email">
          <input className={inputCls} value={form.pickupContactEmail} onChange={(e) => set('pickupContactEmail', e.target.value)} />
        </Field>
        <Field label="Alternate contact person">
          <input className={inputCls} value={form.pickupAltContactPerson} onChange={(e) => set('pickupAltContactPerson', e.target.value)} />
        </Field>
        <Field label="Alternate contact number">
          <input className={inputCls} value={form.pickupAltContactNo} onChange={(e) => set('pickupAltContactNo', e.target.value)} />
        </Field>
      </Section>

      <Section title="Parcels">
        <ParcelRows rows={form.parcels} onChange={(p) => set('parcels', p)} />
      </Section>

      <Section title="Delivery details">
        {mode === 'create' && <LocationPicker locations={savedDeliveries} onPick={fillDelivery} label="Use a saved delivery location" />}
        <Field label="Delivery address" required full>
          <textarea rows={2} className={inputCls} value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} />
        </Field>
        <Field label="City" required>
          <input className={inputCls} value={form.deliveryCity} onChange={(e) => set('deliveryCity', e.target.value)} />
        </Field>
        <Field label="State" required>
          <StateSelect className={inputCls} value={form.deliveryState} onChange={(v) => set('deliveryState', v)} />
        </Field>
        <Field label="Pincode / ZIP" required>
          <input className={inputCls} value={form.deliveryPincode} onChange={(e) => set('deliveryPincode', e.target.value)} onBlur={() => autofill('delivery', form.deliveryPincode)} />
          <PincodeNote pincode={form.deliveryPincode} leg="delivery" scope={form.scope} />
        </Field>
        <Field label="Contact number" required>
          <input className={inputCls} value={form.deliveryContactNo} onChange={(e) => set('deliveryContactNo', e.target.value)} />
        </Field>
        <Field label="Contact person">
          <input className={inputCls} value={form.deliveryContactPerson} onChange={(e) => set('deliveryContactPerson', e.target.value)} />
        </Field>
        <Field label="Contact email">
          <input className={inputCls} value={form.deliveryContactEmail} onChange={(e) => set('deliveryContactEmail', e.target.value)} />
        </Field>
        <Field label="Alternate contact person">
          <input className={inputCls} value={form.deliveryAltContactPerson} onChange={(e) => set('deliveryAltContactPerson', e.target.value)} />
        </Field>
        <Field label="Alternate contact number">
          <input className={inputCls} value={form.deliveryAltContactNo} onChange={(e) => set('deliveryAltContactNo', e.target.value)} />
        </Field>
        <Field label="Additional information" full>
          <textarea rows={2} className={inputCls} value={form.additionalInfo} onChange={(e) => set('additionalInfo', e.target.value)} />
        </Field>
      </Section>

      {mode === 'edit' && (
        <Section title="Commercial & Ops">
          <Field label="AWB">
            <input className={inputCls} value={form.awb} onChange={(e) => set('awb', e.target.value)} />
          </Field>
          <Field label="Status" required>
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {statusList
                .filter((s) => s.isActive || s.code === form.status)
                .map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Batch no.">
            <input className={inputCls} value={form.batchNo} onChange={(e) => set('batchNo', e.target.value)} />
          </Field>
          <Field label="Chargeable weight (kg)">
            <input type="number" min={0} step="any" className={inputCls} value={form.chargeableWeight} onChange={(e) => set('chargeableWeight', e.target.value)} />
          </Field>
          <Field label="Estimated delivery date">
            <input className={inputCls} value={form.estimatedDeliveryDate} onChange={(e) => set('estimatedDeliveryDate', e.target.value)} placeholder="e.g. 12-Jun-2026" />
          </Field>
          <Field label="Billing amount (₹)">
            <input type="number" min={0} step="any" className={inputCls} value={form.billingAmount} onChange={(e) => set('billingAmount', e.target.value)} />
          </Field>
          <Field label="Remarks" full>
            <textarea rows={2} className={inputCls} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} />
          </Field>
        </Section>
      )}

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? <span className="inline-flex items-center gap-2"><BrandDots /> Saving…</span> : submitLabel}
        </button>
      </div>
    </form>
  );
}
