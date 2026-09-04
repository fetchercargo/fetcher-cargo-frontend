'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BrandDots } from '@/components/BrandLoader';
import { saveShipmentCustomFields, type CustomFieldValue } from '@/lib/customFields';

const inputCls =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

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

  if (initial.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-brand-dark">Additional Information</h2>
        <p className="text-gray-400 text-sm mt-3">
          No custom fields yet — define them in{' '}
          <Link href="/admin/settings/fields" className="text-brand-orange hover:text-brand-coral font-medium">
            Settings → Custom Fields
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark">Additional Information</h2>

      <div className="mt-4 space-y-4">
        {initial.map((f) => (
          <label key={f.fieldId} className="block">
            <span className="block text-sm font-medium text-brand-dark">
              {f.label}
              {!f.isActive && <span className="ml-1.5 text-xs font-normal text-gray-400">(inactive)</span>}
              {f.visibleToClient && <span className="ml-1.5 text-xs font-normal text-gray-400">Client can see this</span>}
            </span>
            {f.fieldType === 'boolean' ? (
              <select
                value={values[f.fieldId] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.fieldId]: e.target.value }))}
                className={`${inputCls} mt-1`}
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type={f.fieldType === 'number' ? 'number' : 'text'}
                step={f.fieldType === 'number' ? 'any' : undefined}
                value={values[f.fieldId] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [f.fieldId]: e.target.value }))}
                className={`${inputCls} mt-1`}
              />
            )}
          </label>
        ))}
      </div>

      {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

      <div className="flex items-center justify-end gap-3 mt-4">
        {saved && !error && <span className="text-sm font-medium text-green-600">✓ Saved</span>}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <span className="inline-flex items-center gap-2"><BrandDots /> Saving…</span> : 'Save custom fields'}
        </button>
      </div>
    </div>
  );
}
