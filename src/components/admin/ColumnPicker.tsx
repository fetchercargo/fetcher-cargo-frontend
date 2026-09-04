'use client';

import { useState } from 'react';

export interface ShipmentColumn {
  key: string;
  label: string;
}

// Canonical list of columns available on the admin shipments table. This
// order is the DEFAULT layout and the order unselected columns are listed in
// the picker; once a user reorders with the arrows, their saved order wins
// (see visibleColumns on the shipments page).
export const SHIPMENT_COLUMNS: ShipmentColumn[] = [
  // Defaults.
  { key: 'awb', label: 'AWB' },
  { key: 'clientCode', label: 'Client' },
  { key: 'businessName', label: 'Business name' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Created' },
  { key: 'route', label: 'Route' },
  { key: 'mode', label: 'Mode' },
  { key: 'shipmentType', label: 'Type' },
  // Opt-in extras, grouped by kind; each lands right of the defaults when enabled.
  { key: 'ownerEmail', label: 'Email' },
  { key: 'businessEmail', label: 'Business email' },
  { key: 'primaryContactPerson', label: 'Contact person' },
  { key: 'customerRef', label: 'Reference' },
  { key: 'batchNo', label: 'Batch no' },
  { key: 'scope', label: 'Scope' },
  { key: 'shipmentCategory', label: 'Category' },
  { key: 'noOfPieces', label: 'Pieces' },
  { key: 'weightKg', label: 'Weight (kg)' },
  { key: 'billingAmount', label: 'Billing (₹)' },
  { key: 'id', label: 'ID' },
];

export const DEFAULT_COLUMN_KEYS: string[] = [
  'awb',
  'clientCode',
  'businessName',
  'status',
  'createdAt',
  'route',
  'mode',
  'shipmentType',
];

const ctl =
  'h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

export default function ColumnPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false);

  // Badge shows whenever the selection differs from the default — comparing the
  // exact sequence, since order is user-controlled and a reorder of the same
  // eight columns is still a customised table.
  const isDefault =
    value.length === DEFAULT_COLUMN_KEYS.length && DEFAULT_COLUMN_KEYS.every((k, i) => value[i] === k);

  // Columns not yet selected, kept in canonical order; they render below the divider.
  const unselected = SHIPMENT_COLUMNS.filter((c) => !value.includes(c.key));

  // Preserve the user's own ordering: uncheck removes in place, check appends
  // at the end. Never allow zero columns.
  function toggle(key: string) {
    if (value.includes(key)) {
      if (value.length <= 1) return;
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  }

  // Reorder a selected column within the user's sequence; no-op at the ends.
  function move(key: string, direction: -1 | 1) {
    const i = value.indexOf(key);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
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
          <div className="absolute right-0 z-20 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            {/* Selected columns, in the user's own order — reorderable via arrows. */}
            {value.flatMap((k, idx) => {
              const c = SHIPMENT_COLUMNS.find((col) => col.key === k);
              if (!c) return [];
              return [
                <div key={c.key} className="flex items-center gap-1 pr-1 rounded hover:bg-gray-50">
                  <label className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm flex-1 min-w-0">
                    <input
                      type="checkbox"
                      className="accent-brand-orange"
                      checked
                      disabled={value.length === 1}
                      onChange={() => toggle(c.key)}
                    />
                    <span className="truncate">{c.label}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => move(c.key, -1)}
                    disabled={idx === 0}
                    aria-label={`Move ${c.label} up`}
                    className="p-1 rounded text-brand-gray hover:text-brand-orange hover:bg-orange-50 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => move(c.key, 1)}
                    disabled={idx === value.length - 1}
                    aria-label={`Move ${c.label} down`}
                    className="p-1 rounded text-brand-gray hover:text-brand-orange hover:bg-orange-50 disabled:opacity-25 disabled:hover:bg-transparent disabled:cursor-default"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                </div>,
              ];
            })}
            {unselected.length > 0 && <div className="border-t border-gray-100 my-1" />}
            {/* Unselected columns, in canonical order — no position to change yet. */}
            {unselected.map((c) => (
              <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="accent-brand-orange"
                  checked={false}
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
