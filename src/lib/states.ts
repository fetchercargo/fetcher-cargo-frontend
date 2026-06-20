// Canonical Indian states + union territories — the State dropdown options and
// the values stored on addresses. Mirrors the backend model.IndianStates.

export const INDIAN_STATES: string[] = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const STATE_SET = new Map<string, string>(INDIAN_STATES.map((s) => [s.toUpperCase(), s]));

const ALIASES: Record<string, string> = {
  'NEW DELHI': 'Delhi',
  'NCT OF DELHI': 'Delhi',
  ORISSA: 'Odisha',
  PONDICHERRY: 'Puducherry',
  UTTARANCHAL: 'Uttarakhand',
};

const collapse = (s: string) => (s || '').trim().replace(/\s+/g, ' ').toUpperCase();

// normalizeIndianState best-effort maps a (possibly messy) state string onto the
// canonical list; returns null if it can't be matched (caller leaves it blank).
export function normalizeIndianState(s: string): string | null {
  const up = collapse(s);
  if (STATE_SET.has(up)) return STATE_SET.get(up)!;
  if (ALIASES[up]) return ALIASES[up];
  const up2 = collapse((s || '').replace(/&/g, ' and '));
  if (STATE_SET.has(up2)) return STATE_SET.get(up2)!;
  return null;
}

export function isValidIndianState(s: string): boolean {
  return STATE_SET.has(collapse(s));
}
