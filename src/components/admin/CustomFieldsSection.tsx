'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandDots } from '@/components/BrandLoader';
import { saveShipmentCustomFields, type CustomFieldValue } from '@/lib/customFields';

// Matches the inputs in ShipmentForm, which this section sits directly beneath —
// a smaller control here read as a different, lesser part of the page.
const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

/** Small chip for a field's flags, matching the DG badge used in the tables. */
function Chip({ tone, children }: { tone: 'client' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'client'
      ? 'bg-green-50 text-green-700 border-green-200'
      : 'bg-gray-50 text-gray-500 border-gray-200';
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide border px-1.5 py-0.5 rounded ${cls}`}>
      {children}
    </span>
  );
}

/**
 * Renders the input for one field. Shared with the create form so a field looks
 * and behaves identically whether it is filled in at booking or afterwards.
 */
export function CustomFieldInputControl({
  field,
  value,
  onChange,
}: {
  field: Pick<CustomFieldValue, 'fieldId' | 'fieldType'>;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.fieldType === 'boolean') {
    return (
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {/* Blank stays reachable so a value can be cleared. */}
        <option value="">—</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  return (
    <input
      type={field.fieldType === 'number' ? 'number' : 'text'}
      step={field.fieldType === 'number' ? 'any' : undefined}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Label + flag chips, shared with the create form. */
export function CustomFieldLabel({
  field,
}: {
  field: Pick<CustomFieldValue, 'label' | 'visibleToClient' | 'isActive'>;
}) {
  return (
    <span className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-brand-dark">{field.label}</span>
      {field.visibleToClient && <Chip tone="client">Client</Chip>}
      {!field.isActive && <Chip tone="muted">Inactive</Chip>}
    </span>
  );
}

export default function CustomFieldsSection({
  shipmentId,
  initial,
}: {
  shipmentId: number;
  initial: CustomFieldValue[];
}) {
  const [values, setValues] = useState<Record<number, string>>(() => {
    const v: Record<number, string> = {};
    for (const f of initial) v[f.fieldId] = f.value;
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await saveShipmentCustomFields(shipmentId, values);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d && d.error) || 'Could not save the fields.');
        return;
      }
      setSaved(true);
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-brand-dark">Reference Fields</h2>
        <Link
          href="/admin/settings/fields"
          className="text-xs font-semibold text-brand-gray hover:text-brand-orange transition-colors whitespace-nowrap"
        >
          Manage fields →
        </Link>
      </div>

      {initial.length === 0 ? (
        <p className="text-gray-400 text-sm mt-3">
          No reference fields yet — add one in{' '}
          <Link href="/admin/settings/fields" className="text-brand-orange hover:text-brand-coral font-medium">
            Settings
          </Link>{' '}
          and it will appear on every shipment.
        </p>
      ) : (
        <>
          {/* Two columns, matching the sections above it on this page. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {initial.map((f) => (
              <label key={f.fieldId} className="flex flex-col gap-1.5">
                <CustomFieldLabel field={f} />
                <CustomFieldInputControl
                  field={f}
                  value={values[f.fieldId] ?? ''}
                  onChange={(v) => setValues((prev) => ({ ...prev, [f.fieldId]: v }))}
                />
              </label>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}

          <div className="flex items-center justify-end gap-3 mt-5">
            {saved && !error && <span className="text-sm font-medium text-green-600">✓ Saved</span>}
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-8 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <BrandDots /> Saving…
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
