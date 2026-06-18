'use client';

export interface ParcelFormState {
  noOfPieces: string;
  weightKg: string;
  dimensions: string;
}

export const MAX_PARCELS = 5;
export const emptyParcel = (): ParcelFormState => ({ noOfPieces: '1', weightKg: '', dimensions: '' });

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';
const labelCls = 'text-sm font-medium text-brand-dark';

/** Repeatable list of parcels (1..MAX_PARCELS), each with pieces/weight/dimensions. */
export default function ParcelRows({ rows, onChange }: { rows: ParcelFormState[]; onChange: (rows: ParcelFormState[]) => void }) {
  function update(i: number, key: keyof ParcelFormState, value: string) {
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  }
  function add() {
    if (rows.length < MAX_PARCELS) onChange([...rows, emptyParcel()]);
  }
  function remove(i: number) {
    if (rows.length > 1) onChange(rows.filter((_, idx) => idx !== i));
  }

  const totalPieces = rows.reduce((s, r) => s + (Number(r.noOfPieces) || 0), 0);
  const totalWeight = rows.reduce((s, r) => s + (Number(r.weightKg) || 0), 0);

  return (
    <div className="space-y-3 sm:col-span-2">
      {rows.map((r, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 bg-gray-50/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-brand-gray">Parcel {i + 1}</span>
            {rows.length > 1 && (
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 text-xs font-semibold">
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className={labelCls}>No. of pieces <span className="text-red-500">*</span></label>
              <input type="number" min={1} step={1} className={inputCls} value={r.noOfPieces} onChange={(e) => update(i, 'noOfPieces', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Weight (kg) <span className="text-red-500">*</span></label>
              <input type="number" min={0} step="any" className={inputCls} value={r.weightKg} onChange={(e) => update(i, 'weightKg', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className={labelCls}>Dimensions (cm)</label>
              <input className={inputCls} placeholder="30x20x15" value={r.dimensions} onChange={(e) => update(i, 'dimensions', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={add}
          disabled={rows.length >= MAX_PARCELS}
          className="text-sm font-semibold text-brand-orange hover:text-brand-coral disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add parcel{rows.length >= MAX_PARCELS ? ` (max ${MAX_PARCELS})` : ''}
        </button>
        <span className="text-xs text-gray-500">
          Total: {totalPieces} pcs{totalWeight ? ` · ${+totalWeight.toFixed(3)} kg` : ''}
        </span>
      </div>
    </div>
  );
}
