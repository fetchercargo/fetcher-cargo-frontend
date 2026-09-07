'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MODES } from '@/lib/admin';
import LabelPreview from '@/components/admin/LabelPreview';
import {
  downloadName,
  emptyLabel,
  fetchPrefill,
  renderShipmentLabel,
  suggestAWBs,
  type LabelAddress,
  type ShipmentLabelInput,
} from '@/lib/labels';

// The shipment label generator: a hand-fillable form with an AWB search that
// PREFILLS it. Every field stays editable after a pull, and an unknown AWB
// warns rather than blocking — a label for a consignment that is not in the
// system yet is a supported case, not a mistake.

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  maxLength = 200,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-brand-dark">{label}</span>
      <input
        className={inputCls}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </label>
  );
}

function AddressFields({
  value,
  onChange,
  nameLabel,
}: {
  value: LabelAddress;
  onChange: (a: LabelAddress) => void;
  nameLabel: string;
}) {
  const set = (k: keyof LabelAddress) => (v: string) => onChange({ ...value, [k]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label={nameLabel} value={value.name} onChange={set('name')} />
      </div>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-sm font-medium text-brand-dark">Address</span>
        <textarea
          className={`${inputCls} min-h-[76px] resize-y`}
          value={value.address}
          maxLength={2000}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
        />
      </label>
      <Field label="City" value={value.city} onChange={set('city')} />
      <Field label="State" value={value.state} onChange={set('state')} />
      <Field label="Pincode" value={value.pincode} onChange={set('pincode')} />
      <Field label="Country" value={value.country} onChange={set('country')} hint="Not stored on a shipment — typed each time." />
      <div className="sm:col-span-2">
        <Field label="Mobile" value={value.mobile} onChange={set('mobile')} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-brand-dark uppercase tracking-wide">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ShipmentLabelPage() {
  const [label, setLabel] = useState<ShipmentLabelInput>(emptyLabel);
  const [awbQuery, setAwbQuery] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [renderedSnapshot, setRenderedSnapshot] = useState<string | null>(null);

  const snapshot = useMemo(() => JSON.stringify(label), [label]);
  const stale = renderedSnapshot !== null && renderedSnapshot !== snapshot;

  // Type-to-search, debounced. The suggestion list carries AWB strings only —
  // the addresses behind a shipment are fetched once one has been chosen.
  useEffect(() => {
    const term = awbQuery.trim();
    let cancelled = false;
    // Every state change happens inside the timer, never synchronously in the
    // effect body — including clearing the list for a too-short term.
    const t = setTimeout(() => {
      if (cancelled) return;
      if (term.length < 2) {
        setOptions([]);
        return;
      }
      suggestAWBs(term)
        .then((a) => {
          if (!cancelled) setOptions(a);
        })
        .catch(() => {
          if (!cancelled) setOptions([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [awbQuery]);

  async function load() {
    const awb = awbQuery.trim();
    if (!awb || loading) return;
    setLoading(true);
    setNotice('');
    setLookupError('');
    try {
      const p = await fetchPrefill(awb);
      setLabel(p.label);
      setNotice(
        p.found
          ? `Filled in from ${p.awb}${p.pieces > 0 ? ` — ${p.pieces} piece${p.pieces === 1 ? '' : 's'} recorded` : ''}. Every field is still editable.`
          : (p.message ?? 'No shipment found for this AWB. You can still fill the label in by hand.')
      );
    } catch (e) {
      setLookupError(e instanceof Error ? e.message : 'Could not look that AWB up.');
    } finally {
      setLoading(false);
    }
  }

  // Preserve a prefilled mode that is not one of the four canonical values
  // rather than silently dropping it: the label must say what the shipment
  // says.
  const modeOptions = useMemo(() => {
    const m = label.serviceType.trim();
    return m && !MODES.includes(m) ? [...MODES, m] : MODES;
  }, [label.serviceType]);

  const set = <K extends keyof ShipmentLabelInput>(k: K) => (v: ShipmentLabelInput[K]) =>
    setLabel((prev) => ({ ...prev, [k]: v }));

  async function doRender() {
    const blob = await renderShipmentLabel(label);
    setRenderedSnapshot(JSON.stringify(label));
    return blob;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Link href="/admin/labels" className="text-sm font-medium text-gray-500 hover:text-brand-orange transition-colors">
        ← Labels
      </Link>
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark mt-2">Shipment Label Generator</h1>
      <p className="text-gray-500 mt-1">
        One 4&times;6 inch label. Search an AWB to fill the form in, or type it all by hand.
      </p>

      {/* AWB search */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-brand-dark">Fill from an AWB</span>
          <div className="flex flex-wrap gap-3">
            <input
              className={`${inputCls} flex-1 min-w-[220px]`}
              list="label-awbs"
              placeholder="Start typing an AWB…"
              value={awbQuery}
              maxLength={200}
              onChange={(e) => setAwbQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void load();
                }
              }}
            />
            <datalist id="label-awbs">
              {options.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <button
              type="button"
              onClick={load}
              disabled={loading || !awbQuery.trim()}
              className="px-5 py-2 bg-brand-dark text-white text-sm font-semibold rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading…' : 'Fill form'}
            </button>
          </div>
          <span className="text-xs text-gray-400">
            Optional. This replaces what is currently in the form; nothing is written back to the shipment.
          </span>
        </label>

        {notice && <p className="mt-3 text-sm text-brand-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">{notice}</p>}
        {lookupError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {lookupError}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="flex flex-col gap-5">
          <Section title="Service">
            <label className="flex flex-col gap-1.5 max-w-xs">
              <span className="text-sm font-medium text-brand-dark">Service type</span>
              <select className={inputCls} value={label.serviceType} onChange={(e) => set('serviceType')(e.target.value)}>
                <option value="">— none —</option>
                {modeOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </Section>

          <Section title="Shipped by (if undelivered, return to)">
            <AddressFields
              value={label.shippedBy}
              onChange={(a) => set('shippedBy')(a)}
              nameLabel="Company"
            />
          </Section>

          <Section title="Ship to">
            <AddressFields value={label.shipTo} onChange={(a) => set('shipTo')(a)} nameLabel="Customer name" />
          </Section>

          <Section title="Package details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Destination"
                value={label.destination}
                onChange={set('destination')}
                hint="The delivery city, printed large."
              />
              <Field label="Booking date" value={label.bookingDate} onChange={set('bookingDate')} placeholder="07 Sep 2026" />
              <Field label="Actual weight" value={label.actualWeight} onChange={set('actualWeight')} placeholder="12.5 kg" />
              <Field
                label="Volumetric weight"
                value={label.volumetricWeight}
                onChange={set('volumetricWeight')}
                placeholder="8.4 kg"
                hint="Not stored on a shipment — typed each time."
              />
              <Field label="No. of pieces" value={label.pieces} onChange={set('pieces')} />
              <Field
                label="E-way bill no."
                value={label.eWayBillNo}
                onChange={set('eWayBillNo')}
                hint="Not stored on a shipment — typed each time."
              />
            </div>
          </Section>

          <Section title="Tracking">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tracking ID (AWB)" value={label.trackingId} onChange={set('trackingId')} />
            </div>
            <label className="flex flex-col gap-1.5 mt-4">
              <span className="text-sm font-medium text-brand-dark">Delivery instructions</span>
              <textarea
                className={`${inputCls} min-h-[68px] resize-y`}
                value={label.deliveryInstructions}
                maxLength={1000}
                onChange={(e) => set('deliveryInstructions')(e.target.value)}
              />
              <span className="text-xs text-gray-400">
                Prefilled from the customer&rsquo;s own note at booking. Internal remarks are never printed.
              </span>
            </label>
          </Section>
        </div>

        <div className="lg:sticky lg:top-6">
          <LabelPreview
            render={doRender}
            filename={downloadName('shipment-label', label.trackingId)}
            stale={stale}
            aspect="4/6"
            emptyHint="Fill the form in, then generate the preview. What you see here is the file you save."
          />
        </div>
      </div>
    </div>
  );
}
