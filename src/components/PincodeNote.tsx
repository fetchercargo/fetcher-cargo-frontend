'use client';

import { useEffect, useState } from 'react';
import { isOda, placeLabel, type PincodeLookup } from '@/lib/pincode';

/**
 * Inline, non-blocking serviceability note for a pincode field. Checks the union
 * across both B2B/B2C sheets and is leg-aware (pickup vs delivery). Only shown for
 * DOMESTIC shipments once a 6-digit pincode is entered. Never affects submit.
 */
export default function PincodeNote({ pincode, leg, scope }: { pincode: string; leg: 'pickup' | 'delivery'; scope: string }) {
  const domestic = (scope || '').trim().toUpperCase() === 'DOMESTIC';
  const p = (pincode || '').trim();
  const active = domestic && p.length >= 6;

  // data is tagged with the pincode it belongs to, so a stale response for a
  // previous pincode is never shown.
  const [data, setData] = useState<{ pincode: string; lookup: PincodeLookup | null } | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const t = setTimeout(() => {
      fetch(`/api/serviceability/${encodeURIComponent(p)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!cancelled) setData({ pincode: p, lookup: d as PincodeLookup | null });
        })
        .catch(() => {
          if (!cancelled) setData({ pincode: p, lookup: null });
        });
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [p, active]);

  if (!active) return null;
  if (!data || data.pincode !== p) return <p className="text-xs text-gray-400 mt-1">Checking serviceability…</p>;
  const lookup = data.lookup;
  if (!lookup) return null;

  const covered = leg === 'pickup' ? lookup.anyPickup : lookup.anyDeliver;
  const oda = lookup.results.some((r) => isOda(r.odaCategory));
  const place = placeLabel(lookup.results[0] ?? {});

  if (covered && !oda) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-green-600 mt-1">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        Serviceable for {leg}{place ? ` — ${place}` : ''}
      </p>
    );
  }
  const msg = covered
    ? `Serviceable for ${leg}, but ODA — may add transit time or charges`
    : `Not in our serviceable list for ${leg} — you can still book`;
  return (
    <p className="flex items-center gap-1.5 text-xs text-amber-700 mt-1">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
      {msg}
    </p>
  );
}
