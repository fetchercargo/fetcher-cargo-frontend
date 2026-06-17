'use client';

import { useEffect, useState } from 'react';
import { SCOPES, TYPES, MODES, CATEGORIES, STATUSES, titleCase, type ClientLocation, type ClientOption } from '@/lib/admin';
import { BrandDots } from '@/components/BrandLoader';

export interface ShipmentFormState {
  clientCode: string;
  scope: string;
  pickupAddress: string;
  pickupPincode: string;
  pickupContactPerson: string;
  pickupContactNo: string;
  pickupContactEmail: string;
  pickupAltContactPerson: string;
  pickupAltContactNo: string;
  noOfPieces: string;
  weightKg: string;
  dimensions: string;
  deliveryAddress: string;
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
  clientCode: '', scope: 'DOMESTIC', pickupAddress: '', pickupPincode: '', pickupContactPerson: '',
  pickupContactNo: '', pickupContactEmail: '', pickupAltContactPerson: '', pickupAltContactNo: '',
  noOfPieces: '1', weightKg: '', dimensions: '',
  deliveryAddress: '', deliveryPincode: '', deliveryContactPerson: '', deliveryContactNo: '', deliveryContactEmail: '',
  deliveryAltContactPerson: '', deliveryAltContactNo: '',
  shipmentType: 'COMMERCIAL', mode: 'SURFACE', shipmentCategory: 'NON-DOC', isDg: false, additionalInfo: '', customerRef: '',
  awb: '', status: 'SHIPMENT CREATED', batchNo: '', chargeableWeight: '', estimatedDeliveryDate: '', billingAmount: '', remarks: '',
};

// The address-block fields, blanked — used to reset both sides when the selected
// client changes, so one client's address can never carry into another's booking.
const BLANK_ADDRESS = {
  pickupAddress: '', pickupPincode: '', pickupContactPerson: '', pickupContactNo: '', pickupContactEmail: '', pickupAltContactPerson: '', pickupAltContactNo: '',
  deliveryAddress: '', deliveryPincode: '', deliveryContactPerson: '', deliveryContactNo: '', deliveryContactEmail: '', deliveryAltContactPerson: '', deliveryAltContactNo: '',
};

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const roInputCls =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed';
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

// Required selector of a client's saved locations. Used when booking ON BEHALF
// of a client: the pickup/delivery address must come from a saved location, not
// be free-typed.
function SavedAddressSelect({
  locations,
  value,
  onSelect,
  label,
  placeholder,
}: {
  locations: ClientLocation[];
  value: string;
  onSelect: (id: string, l: ClientLocation | null) => void;
  label: string;
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <label className={labelCls}>
        {label} <span className="text-red-500">*</span>
      </label>
      <select
        className={inputCls}
        value={value}
        required
        onChange={(e) => onSelect(e.target.value, locations.find((x) => String(x.id) === e.target.value) ?? null)}
      >
        <option value="">{placeholder}</option>
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
  // Booking on behalf of a client (create-for-client) restricts addresses to the
  // client's saved locations; editing an existing shipment stays free-text.
  const isBehalf = mode === 'create';

  function set<K extends keyof ShipmentFormState>(key: K, value: ShipmentFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Saved locations for the selected client, plus which client they belong to
  // (so we can show a loading state instead of stale options after a switch).
  const [savedPickups, setSavedPickups] = useState<ClientLocation[]>([]);
  const [savedDeliveries, setSavedDeliveries] = useState<ClientLocation[]>([]);
  const [locsClient, setLocsClient] = useState('');
  const [pickupLocId, setPickupLocId] = useState('');
  const [deliveryLocId, setDeliveryLocId] = useState('');

  useEffect(() => {
    if (mode !== 'create' || !form.clientCode) return;
    const code = form.clientCode;
    let active = true;
    fetch(`/api/admin/clients/${encodeURIComponent(code)}/locations`)
      .then((r) => (r.ok ? r.json() : { pickups: [], deliveries: [] }))
      .then((d) => {
        if (!active) return;
        setSavedPickups(d.pickups ?? []);
        setSavedDeliveries(d.deliveries ?? []);
        setLocsClient(code);
      })
      .catch(() => {
        if (!active) return;
        // Treat a failed lookup as "no saved locations" → free-text fallback.
        setSavedPickups([]);
        setSavedDeliveries([]);
        setLocsClient(code);
      });
    return () => {
      active = false;
    };
  }, [mode, form.clientCode]);

  // Changing the client resets the chosen addresses (event handler — not the
  // effect — so there is no cascading setState during render).
  function selectClient(code: string) {
    setPickupLocId('');
    setDeliveryLocId('');
    setForm((f) => ({ ...f, clientCode: code, ...BLANK_ADDRESS }));
  }

  function fillPickup(l: ClientLocation) {
    setForm((f) => ({ ...f, pickupAddress: l.address, pickupPincode: l.pincode, pickupContactPerson: l.contactPerson, pickupContactNo: l.contactNo, pickupContactEmail: l.email, pickupAltContactPerson: l.altContactPerson, pickupAltContactNo: l.altContactNo }));
  }
  function fillDelivery(l: ClientLocation) {
    setForm((f) => ({ ...f, deliveryAddress: l.address, deliveryPincode: l.pincode, deliveryContactPerson: l.contactPerson, deliveryContactNo: l.contactNo, deliveryContactEmail: l.email, deliveryAltContactPerson: l.altContactPerson, deliveryAltContactNo: l.altContactNo }));
  }
  const clearPickup = () =>
    setForm((f) => ({ ...f, pickupAddress: '', pickupPincode: '', pickupContactPerson: '', pickupContactNo: '', pickupContactEmail: '', pickupAltContactPerson: '', pickupAltContactNo: '' }));
  const clearDelivery = () =>
    setForm((f) => ({ ...f, deliveryAddress: '', deliveryPincode: '', deliveryContactPerson: '', deliveryContactNo: '', deliveryContactEmail: '', deliveryAltContactPerson: '', deliveryAltContactNo: '' }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const base = {
      scope: form.scope,
      pickupAddress: form.pickupAddress,
      pickupPincode: form.pickupPincode,
      pickupContactPerson: form.pickupContactPerson,
      pickupContactNo: form.pickupContactNo,
      pickupContactEmail: form.pickupContactEmail,
      pickupAltContactPerson: form.pickupAltContactPerson,
      pickupAltContactNo: form.pickupAltContactNo,
      noOfPieces: Number(form.noOfPieces) || 0,
      weightKg: Number(form.weightKg) || 0,
      dimensions: form.dimensions,
      deliveryAddress: form.deliveryAddress,
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

  const locsReady = locsClient === form.clientCode;

  // Address blocks (editable free-text vs locked-to-saved) and the shared,
  // always-editable contact fields, declared once and slotted into each branch.
  const pickupAddressEditable = (
    <>
      <Field label="Pickup address" required full>
        <textarea rows={2} className={inputCls} value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} />
      </Field>
      <Field label="Pincode / ZIP" required>
        <input className={inputCls} value={form.pickupPincode} onChange={(e) => set('pickupPincode', e.target.value)} />
      </Field>
    </>
  );
  const pickupAddressSaved = (
    <>
      <SavedAddressSelect
        label="Pickup location"
        placeholder="Select the client's saved pickup location…"
        locations={savedPickups}
        value={pickupLocId}
        onSelect={(id, l) => {
          setPickupLocId(id);
          if (l) fillPickup(l);
          else clearPickup();
        }}
      />
      <Field label="Pickup address" required full>
        <textarea rows={2} className={roInputCls} value={form.pickupAddress} readOnly placeholder="Choose a saved pickup location above" />
      </Field>
      <Field label="Pincode / ZIP" required>
        <input className={roInputCls} value={form.pickupPincode} readOnly />
      </Field>
    </>
  );
  const pickupContactFields = (
    <>
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
    </>
  );

  const deliveryAddressEditable = (
    <>
      <Field label="Delivery address" required full>
        <textarea rows={2} className={inputCls} value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} />
      </Field>
      <Field label="Pincode / ZIP" required>
        <input className={inputCls} value={form.deliveryPincode} onChange={(e) => set('deliveryPincode', e.target.value)} />
      </Field>
    </>
  );
  const deliveryAddressSaved = (
    <>
      <SavedAddressSelect
        label="Delivery location"
        placeholder="Select the client's saved delivery location…"
        locations={savedDeliveries}
        value={deliveryLocId}
        onSelect={(id, l) => {
          setDeliveryLocId(id);
          if (l) fillDelivery(l);
          else clearDelivery();
        }}
      />
      <Field label="Delivery address" required full>
        <textarea rows={2} className={roInputCls} value={form.deliveryAddress} readOnly placeholder="Choose a saved delivery location above" />
      </Field>
      <Field label="Pincode / ZIP" required>
        <input className={roInputCls} value={form.deliveryPincode} readOnly />
      </Field>
    </>
  );
  const deliveryContactFields = (
    <>
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
    </>
  );
  const additionalInfoField = (
    <Field label="Additional information" full>
      <textarea rows={2} className={inputCls} value={form.additionalInfo} onChange={(e) => set('additionalInfo', e.target.value)} />
    </Field>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'create' && (
        <Section title="Client">
          <Field label="Book on behalf of" required full>
            <select className={inputCls} value={form.clientCode} onChange={(e) => selectClient(e.target.value)} required>
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
        {!isBehalf ? (
          <>{pickupAddressEditable}{pickupContactFields}</>
        ) : !form.clientCode ? (
          <p className="text-sm text-gray-400 sm:col-span-2">Select a client above to choose their saved pickup address.</p>
        ) : !locsReady ? (
          <p className="text-sm text-gray-400 sm:col-span-2">Loading saved addresses…</p>
        ) : savedPickups.length > 0 ? (
          <>{pickupAddressSaved}{pickupContactFields}</>
        ) : (
          <>
            <p className="text-xs text-amber-600 sm:col-span-2">This client has no saved pickup location — enter it below.</p>
            {pickupAddressEditable}
            {pickupContactFields}
          </>
        )}
      </Section>

      <Section title="Parcel">
        <Field label="No. of pieces" required>
          <input type="number" min={1} className={inputCls} value={form.noOfPieces} onChange={(e) => set('noOfPieces', e.target.value)} />
        </Field>
        <Field label="Weight (kg)" required>
          <input type="number" min={0} step="any" className={inputCls} value={form.weightKg} onChange={(e) => set('weightKg', e.target.value)} />
        </Field>
        <Field label="Dimensions (cm)">
          <input className={inputCls} value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} placeholder="30x20x15" />
        </Field>
      </Section>

      <Section title="Delivery details">
        {!isBehalf ? (
          <>{deliveryAddressEditable}{deliveryContactFields}{additionalInfoField}</>
        ) : !form.clientCode ? (
          <p className="text-sm text-gray-400 sm:col-span-2">Select a client above to choose their saved delivery address.</p>
        ) : !locsReady ? (
          <p className="text-sm text-gray-400 sm:col-span-2">Loading saved addresses…</p>
        ) : savedDeliveries.length > 0 ? (
          <>{deliveryAddressSaved}{deliveryContactFields}{additionalInfoField}</>
        ) : (
          <>
            <p className="text-xs text-amber-600 sm:col-span-2">This client has no saved delivery location — enter it below.</p>
            {deliveryAddressEditable}
            {deliveryContactFields}
            {additionalInfoField}
          </>
        )}
      </Section>

      {mode === 'edit' && (
        <Section title="Commercial & Ops">
          <Field label="AWB">
            <input className={inputCls} value={form.awb} onChange={(e) => set('awb', e.target.value)} />
          </Field>
          <Field label="Status" required>
            <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
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
