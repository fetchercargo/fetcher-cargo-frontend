// Types + helpers for pincode serviceability. Wire shapes mirror the Go model
// (internal/model/pincode.go).

export type Segment = 'B2B' | 'B2C';

export interface ServiceablePincode {
  segment: string;
  pincode: string;
  status: string;
  canPickup: boolean;
  canDeliver: boolean;
  mode: string;
  odaCategory: string;
  hubCode: string;
  hubCity: string;
  state: string;
  additionalInfo: string;
}

export interface PincodeLookup {
  pincode: string;
  results: ServiceablePincode[];
  anyPickup: boolean;
  anyDeliver: boolean;
}

// isOda reports whether a category string marks an out-of-delivery-area pincode.
export function isOda(category: string | undefined): boolean {
  return (category ?? '').trim().toUpperCase() === 'ODA';
}

// placeLabel joins hub city + state into a readable location ("Bengaluru, KA").
export function placeLabel(p: { hubCity?: string; state?: string }): string {
  return [p.hubCity?.trim(), p.state?.trim()].filter(Boolean).join(', ');
}

// fetchPincodeAutofill looks up a pincode and returns a suggested city (hub) +
// canonical state for auto-filling an address form. Returns null if not found or
// the pincode is too short. State is mapped onto the canonical dropdown list.
export async function fetchPincodeAutofill(pincode: string): Promise<{ city: string; state: string } | null> {
  const p = (pincode || '').trim();
  if (p.length < 6) return null;
  try {
    const { normalizeIndianState } = await import('./states');
    const res = await fetch(`/api/serviceability/${encodeURIComponent(p)}`);
    if (!res.ok) return null;
    const d = (await res.json()) as PincodeLookup;
    const rec = d.results?.[0];
    if (!rec) return null;
    return { city: rec.hubCity || '', state: normalizeIndianState(rec.state || '') || '' };
  } catch {
    return null;
  }
}
