'use client';

import { emptyLocation, type ClientLocationInput } from '@/lib/admin';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

/** Editable, repeatable list of pickup or delivery locations (≥1 required). */
export default function LocationRows({
  kind,
  rows,
  onChange,
}: {
  kind: 'pickup' | 'delivery';
  rows: ClientLocationInput[];
  onChange: (rows: ClientLocationInput[]) => void;
}) {
  const label = kind === 'pickup' ? 'Pickup' : 'Delivery';

  function update(i: number, key: keyof ClientLocationInput, value: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <p className="text-sm text-gray-400">No {label.toLowerCase()} locations yet — add at least one.</p>
      )}
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-gray">
              {label} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              className="text-gray-400 hover:text-red-500 text-xs font-semibold"
            >
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input className={inputCls} placeholder="Label, e.g. Main Warehouse *" value={r.label} onChange={(e) => update(i, 'label', e.target.value)} />
            <input className={inputCls} placeholder="Pincode / ZIP" value={r.pincode} onChange={(e) => update(i, 'pincode', e.target.value)} />
            <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Address *" value={r.address} onChange={(e) => update(i, 'address', e.target.value)} />
            <input className={inputCls} placeholder="Contact person" value={r.contactPerson} onChange={(e) => update(i, 'contactPerson', e.target.value)} />
            <input className={inputCls} placeholder="Contact no" value={r.contactNo} onChange={(e) => update(i, 'contactNo', e.target.value)} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="Email" value={r.email} onChange={(e) => update(i, 'email', e.target.value)} />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, emptyLocation()])}
        className="text-sm font-semibold text-brand-orange hover:text-brand-coral"
      >
        + Add {label.toLowerCase()} location
      </button>
    </div>
  );
}
