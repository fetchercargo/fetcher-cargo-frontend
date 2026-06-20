'use client';

import { INDIAN_STATES } from '@/lib/states';

/** A canonical Indian-states dropdown. Preserves an unrecognized incoming value
 *  as a selectable option so existing data isn't silently dropped. */
export default function StateSelect({
  value,
  onChange,
  className,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  id?: string;
}) {
  const known = value === '' || INDIAN_STATES.includes(value);
  return (
    <select id={id} value={known ? value : '__other'} onChange={(e) => onChange(e.target.value === '__other' ? value : e.target.value)} className={className}>
      <option value="">Select state…</option>
      {!known && value !== '' && <option value="__other">{value}</option>}
      {INDIAN_STATES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
