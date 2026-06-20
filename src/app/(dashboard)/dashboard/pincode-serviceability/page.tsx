'use client';

import { useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';
import { isOda, placeLabel, type PincodeLookup, type Segment } from '@/lib/pincode';

const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'B2B', label: 'B2B (Cargo)' },
  { value: 'B2C', label: 'B2C (Express)' },
];

function YesNo({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
        ok ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
      }`}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {ok ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
      </svg>
      {label}
    </span>
  );
}

export default function PincodeServiceabilityPage() {
  const [segment, setSegment] = useState<Segment>('B2B');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PincodeLookup | null>(null);
  const [checked, setChecked] = useState<{ pincode: string; segment: Segment } | null>(null);

  async function check(seg: Segment = segment) {
    const p = pincode.trim();
    if (!p) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/serviceability/${encodeURIComponent(p)}?segment=${seg}`);
      if (!res.ok) {
        setError('Could not check this pincode. Please try again.');
        setResult(null);
        return;
      }
      setResult((await res.json()) as PincodeLookup);
      setChecked({ pincode: p, segment: seg });
    } catch {
      setError('Unable to connect. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const record = result?.results?.[0] ?? null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-brand-dark">Pincode serviceability</h1>
      <p className="text-gray-500 mt-1">Choose a category and enter a pincode to see whether we pick up or deliver there.</p>

      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
        {/* Segment toggle */}
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          {SEGMENTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                setSegment(s.value);
                if (pincode.trim()) check(s.value);
              }}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                segment === s.value ? 'bg-brand-orange text-white' : 'text-brand-gray hover:text-brand-dark'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Pincode input */}
        <form
          className="flex gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            check();
          }}
        >
          <input
            inputMode="numeric"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter pincode"
            className="flex-1 h-11 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading || !pincode.trim()}
            className="px-6 h-11 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <BrandDots /> : 'Check'}
          </button>
        </form>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

        {/* Result */}
        {!error && checked && result && (
          <div className="mt-5">
            {record ? (
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-xl font-bold text-brand-dark font-mono">{checked.pincode}</span>
                  {placeLabel(record) && <span className="text-sm text-gray-500">{placeLabel(record)}</span>}
                  <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{checked.segment}</span>
                </div>
                <div className="flex flex-wrap gap-2.5 mt-3">
                  <YesNo ok={record.canPickup} label="Pickup" />
                  <YesNo ok={record.canDeliver} label="Delivery" />
                </div>
                {isOda(record.odaCategory) && (
                  <p className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-3">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <path d="M12 9v4M12 17h.01" />
                    </svg>
                    Out-of-delivery-area (ODA) — may add transit time or charges.
                  </p>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-sm">
                  {record.status && <Row label="Status" value={record.status} />}
                  {record.mode && <Row label="Mode" value={record.mode} />}
                  {record.odaCategory && <Row label="Category" value={record.odaCategory} />}
                  {record.hubCode && <Row label="Hub" value={record.hubCode} />}
                  {record.additionalInfo && record.additionalInfo.toLowerCase() !== 'none' && (
                    <Row label="Notes" value={record.additionalInfo} />
                  )}
                </dl>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  {checked.pincode} is not in our {checked.segment} serviceable list.
                </p>
                <p className="text-sm text-amber-700 mt-1">It may still be possible — contact the Fetcher Cargo team to confirm coverage.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-brand-dark">{value}</dd>
    </div>
  );
}
