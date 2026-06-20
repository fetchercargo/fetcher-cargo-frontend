'use client';

import { useState } from 'react';
import { BrandDots } from '@/components/BrandLoader';
import { isOda, placeLabel, type PincodeLookup, type Segment } from '@/lib/pincode';

const SEGMENTS: { value: Segment; label: string; hint: string }[] = [
  { value: 'B2B', label: 'B2B', hint: 'Cargo' },
  { value: 'B2C', label: 'B2C', hint: 'Express' },
];

/* ── icons ─────────────────────────────────────────────────────────────── */
const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
function PinIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" {...ic}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function PickupIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M12 19V6" /><path d="m5 12 7-7 7 7" /></svg>;
}
function DeliveryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" {...ic}><path d="M12 5v13" /><path d="m19 12-7 7-7-7" /></svg>;
}
function CheckIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
}
function CrossIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function WarnIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" {...ic} className="flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>;
}

function CapabilityTile({ ok, label, icon }: { ok: boolean; label: string; icon: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${ok ? 'border-emerald-200 bg-emerald-50/70' : 'border-gray-200 bg-gray-50'}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-400'}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-brand-dark">{label}</p>
        <p className={`text-xs font-medium ${ok ? 'text-emerald-700' : 'text-gray-400'}`}>{ok ? 'Available' : 'Not available'}</p>
      </div>
      <span className={`ml-auto flex h-6 w-6 items-center justify-center rounded-full ${ok ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-white'}`}>
        {ok ? <CheckIcon /> : <CrossIcon />}
      </span>
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-light-gray px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-brand-dark truncate">{value}</dd>
    </div>
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
  const serviceable = !!record && (record.canPickup || record.canDeliver);
  const oda = !!record && isOda(record.odaCategory);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">Pincode serviceability</h1>
      <p className="mt-1.5 text-gray-500">Check whether we pick up or deliver at a pincode, by service line.</p>

      {/* Search panel — premium gradient hero */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-purple to-[#3a3886] p-6 shadow-xl shadow-brand-purple/15 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/5 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-coral/10 blur-2xl" />

        <div className="relative">
          <span className="text-xs font-semibold uppercase tracking-widest text-white/60">Service line</span>
          <div className="mt-2 inline-flex rounded-full bg-white/10 p-1 backdrop-blur-sm">
            {SEGMENTS.map((s) => {
              const active = segment === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => {
                    setSegment(s.value);
                    if (pincode.trim()) check(s.value);
                  }}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 motion-reduce:transition-none ${
                    active ? 'bg-white text-brand-purple shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {s.label}
                  <span className={`text-xs font-medium ${active ? 'text-brand-purple/60' : 'text-white/40'}`}>{s.hint}</span>
                </button>
              );
            })}
          </div>

          <form
            className="mt-4 flex flex-col gap-2.5 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
          >
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-gray">
                <PinIcon />
              </span>
              <input
                inputMode="numeric"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="Enter pincode"
                aria-label="Pincode"
                className="h-12 w-full rounded-xl bg-white pl-11 pr-3 text-sm font-medium tabular-nums text-brand-dark placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !pincode.trim()}
              className="flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-orange to-brand-coral px-7 text-sm font-semibold text-white shadow-lg shadow-brand-orange/25 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              {loading ? <BrandDots /> : 'Check coverage'}
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mt-5">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
            <WarnIcon /> {error}
          </div>
        )}

        {!error && loading && <ResultSkeleton />}

        {!error && !loading && checked && result && (
          record ? (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Status header */}
              <div className={`flex items-center gap-3 px-5 py-4 ${serviceable ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${serviceable ? 'bg-emerald-600' : 'bg-amber-500'} text-white`}>
                  {serviceable ? <CheckIcon size={18} /> : <CrossIcon size={18} />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${serviceable ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {serviceable ? 'Serviceable' : 'Listed, but not active'}
                  </p>
                  <p className="flex items-baseline gap-2">
                    <span className="text-lg font-bold tabular-nums text-brand-dark">{checked.pincode}</span>
                    {placeLabel(record) && <span className="text-sm text-gray-500">{placeLabel(record)}</span>}
                  </p>
                </div>
                <span className="ml-auto self-start rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-purple shadow-sm">
                  {checked.segment} · {SEGMENTS.find((s) => s.value === checked.segment)?.hint}
                </span>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <CapabilityTile ok={record.canPickup} label="Pickup" icon={<PickupIcon />} />
                  <CapabilityTile ok={record.canDeliver} label="Delivery" icon={<DeliveryIcon />} />
                </div>

                {oda && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <span className="mt-0.5 text-amber-600"><WarnIcon /></span>
                    <span><span className="font-semibold">Out-of-delivery-area (ODA).</span> Serviceable, but may add transit time or charges.</span>
                  </div>
                )}

                <dl className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {record.status && <DetailChip label="Status" value={record.status} />}
                  {record.mode && <DetailChip label="Mode" value={record.mode} />}
                  {record.odaCategory && <DetailChip label="Category" value={record.odaCategory} />}
                  {record.hubCode && <DetailChip label="Hub" value={record.hubCode} />}
                </dl>

                {record.additionalInfo && record.additionalInfo.toLowerCase() !== 'none' && (
                  <p className="mt-3 text-xs text-gray-500">{record.additionalInfo}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <svg width="24" height="24" viewBox="0 0 24 24" {...ic}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><path d="M9.5 10h5M12 7.5v5" /></svg>
              </span>
              <p className="mt-3 font-semibold text-amber-900">
                <span className="tabular-nums">{checked.pincode}</span> isn&apos;t in our {checked.segment} network
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-amber-700">
                It may still be possible — reach out to the Fetcher Cargo team to confirm coverage for this pincode.
              </p>
            </div>
          )
        )}

        {!error && !loading && !checked && (
          <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-light-gray text-brand-gray">
              <PinIcon />
            </span>
            <p className="mt-3 text-sm text-gray-500">Pick a service line and enter a pincode to see coverage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm motion-safe:animate-pulse">
      <div className="flex items-center gap-3 bg-gray-50 px-5 py-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-16 rounded-xl bg-gray-100" />
          <div className="h-16 rounded-xl bg-gray-100" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
