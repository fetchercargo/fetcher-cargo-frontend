'use client';

import { useState } from 'react';

export interface ShipmentColumn {
  key: string;
  label: string;
}

// Canonical, ordered list of columns available on the admin shipments table.
export const SHIPMENT_COLUMNS: ShipmentColumn[] = [
  { key: 'awb', label: 'AWB' },
  { key: 'clientCode', label: 'Client' },
  { key: 'ownerEmail', label: 'Email' },
  { key: 'businessName', label: 'Business name' },
  { key: 'businessEmail', label: 'Business email' },
  { key: 'primaryContactPerson', label: 'Contact person' },
  { key: 'customerRef', label: 'Reference' },
  { key: 'status', label: 'Status' },
  { key: 'route', label: 'Route' },
  { key: 'mode', label: 'Mode' },
  { key: 'createdAt', label: 'Created' },
  { key: 'id', label: 'ID' },
  { key: 'scope', label: 'Scope' },
  { key: 'shipmentType', label: 'Type' },
  { key: 'shipmentCategory', label: 'Category' },
  { key: 'noOfPieces', label: 'Pieces' },
  { key: 'weightKg', label: 'Weight (kg)' },
  { key: 'batchNo', label: 'Batch no' },
  { key: 'billingAmount', label: 'Billing (₹)' },
];

export const DEFAULT_COLUMN_KEYS: string[] = [
  'awb',
  'clientCode',
  'ownerEmail',
  'customerRef',
  'status',
  'route',
  'mode',
  'createdAt',
];

const ctl =
  'h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

export default function ColumnPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);

  // Badge shows whenever the selection differs from the default set — comparing
  // membership, not just length, so a same-sized custom set still flags itself.
  const isDefault =
    value.length === DEFAULT_COLUMN_KEYS.length && DEFAULT_COLUMN_KEYS.every((k) => value.includes(k));

  // Always rebuild the selection in canonical SHIPMENT_COLUMNS order so the
  // table layout never depends on click order, and never allow zero columns.
  function toggle(key: string) {
    const next = new Set(value);
    if (next.has(key)) {
      if (next.size <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(SHIPMENT_COLUMNS.filter((c) => next.has(c.key)).map((c) => c.key));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${ctl} flex items-center gap-1.5 ${open ? 'text-brand-orange border-brand-orange' : ''}`}
      >
        Columns
        {!isDefault && (
          <span className="bg-brand-orange text-white text-[11px] font-semibold px-1.5 rounded-full">{value.length}</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            {SHIPMENT_COLUMNS.map((c) => (
              <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="accent-brand-orange"
                  checked={value.includes(c.key)}
                  disabled={value.length === 1 && value.includes(c.key)}
                  onChange={() => toggle(c.key)}
                />
                {c.label}
              </label>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                type="button"
                onClick={() => onChange(DEFAULT_COLUMN_KEYS)}
                className="text-xs text-brand-gray hover:text-brand-orange"
              >
                Reset to default
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
