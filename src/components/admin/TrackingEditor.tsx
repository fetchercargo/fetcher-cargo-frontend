'use client';

import { useState } from 'react';
import type { TrackingUpdate } from '@/lib/admin';
import { BrandDots } from '@/components/BrandLoader';

const inputCls =
  'w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

export default function TrackingEditor({
  initial,
  saving,
  onSave,
}: {
  initial: TrackingUpdate[];
  saving: boolean;
  onSave: (updates: TrackingUpdate[]) => void;
}) {
  const [rows, setRows] = useState<TrackingUpdate[]>(() =>
    initial.length ? initial.map((u) => ({ ...u })) : [],
  );

  function update(i: number, key: keyof TrackingUpdate, value: string) {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function addRow() {
    setRows((rs) => [...rs, { date: '', time: '', text: '', sortOrder: rs.length + 1 }]);
  }
  function removeRow(i: number) {
    setRows((rs) => rs.filter((_, idx) => idx !== i));
  }
  function save() {
    const cleaned = rows
      .filter((r) => r.text.trim() !== '')
      .map((r, idx) => ({ ...r, text: r.text.trim(), sortOrder: idx + 1 }));
    onSave(cleaned);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-brand-dark">Tracking timeline</h2>
        <button type="button" onClick={addRow} className="text-sm font-semibold text-brand-orange hover:text-brand-coral transition-colors">
          + Add update
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-400 text-sm mt-3">No tracking updates. Add one above.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
              <input className={`${inputCls} sm:w-32`} placeholder="Date" value={r.date} onChange={(e) => update(i, 'date', e.target.value)} />
              <input className={`${inputCls} sm:w-24`} placeholder="Time" value={r.time} onChange={(e) => update(i, 'time', e.target.value)} />
              <input className={`${inputCls} flex-1`} placeholder="Update text" value={r.text} onChange={(e) => update(i, 'text', e.target.value)} />
              <button type="button" onClick={() => removeRow(i)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5" aria-label="Remove update">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="px-6 py-2.5 bg-brand-purple text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? <span className="inline-flex items-center gap-2"><BrandDots /> Saving…</span> : 'Save timeline'}
        </button>
      </div>
    </div>
  );
}
