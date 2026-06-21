'use client';

import { useState } from 'react';
import { SCOPES, TYPES, MODES, CATEGORIES, STATUSES, titleCase, type ClientOption } from '@/lib/admin';

export interface ShipmentFilterValues {
  q: string;
  statuses: string[];
  client: string;
  mode: string;
  scope: string;
  category: string;
  type: string;
  dg: string; // '' | 'yes' | 'no'
  source: string; // '' | 'website' | 'sheet'
  from: string;
  to: string;
  sort: string; // '' (newest) | 'oldest'
}

export const EMPTY_FILTERS: ShipmentFilterValues = {
  q: '', statuses: [], client: '', mode: '', scope: '', category: '', type: '', dg: '', source: '', from: '', to: '', sort: '',
};

export function parseShipmentFilters(search: string): ShipmentFilterValues {
  const p = new URLSearchParams(search);
  return {
    q: p.get('q') ?? '',
    statuses: p.getAll('status'),
    client: p.get('client') ?? '',
    mode: p.get('mode') ?? '',
    scope: p.get('scope') ?? '',
    category: p.get('category') ?? '',
    type: p.get('type') ?? '',
    dg: p.get('dg') ?? '',
    source: p.get('source') ?? '',
    from: p.get('from') ?? '',
    to: p.get('to') ?? '',
    sort: p.get('sort') ?? '',
  };
}

export function buildShipmentQuery(v: ShipmentFilterValues): string {
  const p = new URLSearchParams();
  v.statuses.forEach((s) => p.append('status', s));
  if (v.q) p.set('q', v.q);
  if (v.client) p.set('client', v.client);
  if (v.mode) p.set('mode', v.mode);
  if (v.scope) p.set('scope', v.scope);
  if (v.category) p.set('category', v.category);
  if (v.type) p.set('type', v.type);
  if (v.dg) p.set('dg', v.dg);
  if (v.source) p.set('source', v.source);
  if (v.from) p.set('from', v.from);
  if (v.to) p.set('to', v.to);
  if (v.sort) p.set('sort', v.sort);
  return p.toString();
}

function hasActiveFilters(v: ShipmentFilterValues): boolean {
  return Boolean(
    v.q || v.statuses.length || v.client || v.mode || v.scope || v.category || v.type || v.dg || v.source || v.from || v.to,
  );
}

const ctl =
  'h-10 px-3 border border-gray-300 rounded-lg text-sm bg-white text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent';

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-orange-50 text-brand-orange text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-full border border-orange-200">
      {label}
      <button type="button" onClick={onRemove} className="hover:bg-orange-100 rounded-full p-0.5" aria-label={`Remove ${label}`}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function ShipmentFilters({
  value,
  onChange,
  clients = [],
  resultCount,
  capped,
  scope = 'admin',
  statusOptions,
}: {
  value: ShipmentFilterValues;
  onChange: (v: ShipmentFilterValues) => void;
  clients?: ClientOption[];
  resultCount: number | null;
  capped: boolean;
  // 'client' hides the Client-code and Source filters (a client only ever sees
  // their own shipments), reusing everything else.
  scope?: 'admin' | 'client';
  // Status options for the filter (admin-managed). Falls back to the built-ins.
  statusOptions?: { code: string; label: string }[];
}) {
  const [more, setMore] = useState(false);
  const statusChoices = statusOptions ?? STATUSES.map((s) => ({ code: s, label: s }));
  const [statusOpen, setStatusOpen] = useState(false);

  function set<K extends keyof ShipmentFilterValues>(k: K, val: ShipmentFilterValues[K]) {
    onChange({ ...value, [k]: val });
  }
  function toggleStatus(s: string) {
    set('statuses', value.statuses.includes(s) ? value.statuses.filter((x) => x !== s) : [...value.statuses, s]);
  }

  const active = hasActiveFilters(value);

  // Active-filter chips.
  const chips: { label: string; onRemove: () => void }[] = [];
  if (value.q) chips.push({ label: `Search: ${value.q}`, onRemove: () => set('q', '') });
  value.statuses.forEach((s) => chips.push({ label: s, onRemove: () => toggleStatus(s) }));
  if (value.client) chips.push({ label: `Client: ${value.client}`, onRemove: () => set('client', '') });
  if (value.mode) chips.push({ label: `Mode: ${titleCase(value.mode)}`, onRemove: () => set('mode', '') });
  if (value.scope) chips.push({ label: `Scope: ${titleCase(value.scope)}`, onRemove: () => set('scope', '') });
  if (value.category) chips.push({ label: `Category: ${titleCase(value.category)}`, onRemove: () => set('category', '') });
  if (value.type) chips.push({ label: `Type: ${titleCase(value.type)}`, onRemove: () => set('type', '') });
  if (value.dg) chips.push({ label: `DG: ${value.dg === 'yes' ? 'Yes' : 'No'}`, onRemove: () => set('dg', '') });
  if (value.source) chips.push({ label: `Source: ${value.source === 'website' ? 'Website' : 'Sheet'}`, onRemove: () => set('source', '') });
  if (value.from) chips.push({ label: `From: ${value.from}`, onRemove: () => set('from', '') });
  if (value.to) chips.push({ label: `To: ${value.to}`, onRemove: () => set('to', '') });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className={`${ctl} w-full pl-9`}
            value={value.q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Search AWB, reference, or batch…"
          />
        </div>

        {/* Status multi-select */}
        <div className="relative">
          <button type="button" onClick={() => setStatusOpen((o) => !o)} className={`${ctl} flex items-center gap-2`}>
            Status{value.statuses.length > 0 && <span className="bg-brand-orange text-white text-[11px] font-semibold px-1.5 rounded-full">{value.statuses.length}</span>}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} aria-hidden="true" />
              <div className="absolute z-20 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                {statusChoices.map((s) => (
                  <label key={s.code} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={value.statuses.includes(s.code)} onChange={() => toggleStatus(s.code)} className="accent-brand-orange" />
                    {s.label}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <input type="date" className={ctl} value={value.from} onChange={(e) => set('from', e.target.value)} title="Created from" />
        <input type="date" className={ctl} value={value.to} onChange={(e) => set('to', e.target.value)} title="Created to" />

        <select className={ctl} value={value.sort} onChange={(e) => set('sort', e.target.value)} title="Sort">
          <option value="">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        <button type="button" onClick={() => setMore((m) => !m)} className={`${ctl} flex items-center gap-1.5 ${more ? 'text-brand-orange border-brand-orange' : 'text-brand-gray'}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
          More filters
        </button>

        {active && (
          <button type="button" onClick={() => onChange(EMPTY_FILTERS)} className="h-10 px-3 text-sm font-semibold text-brand-gray hover:text-red-500 transition-colors">
            Clear all
          </button>
        )}
      </div>

      {/* More filters */}
      {more && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
          {scope !== 'client' && (
            <Field label="Client code">
              <input list="admin-client-codes" className={`${ctl} w-full`} value={value.client} onChange={(e) => set('client', e.target.value)} placeholder="FCC0001" />
              <datalist id="admin-client-codes">
                {clients.map((c) => (
                  <option key={c.clientCode} value={c.clientCode}>{c.name}</option>
                ))}
              </datalist>
            </Field>
          )}
          <Field label="Mode">
            <select className={`${ctl} w-full`} value={value.mode} onChange={(e) => set('mode', e.target.value)}>
              <option value="">Any</option>
              {MODES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </Field>
          <Field label="Scope">
            <select className={`${ctl} w-full`} value={value.scope} onChange={(e) => set('scope', e.target.value)}>
              <option value="">Any</option>
              {SCOPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </Field>
          <Field label="Category">
            <select className={`${ctl} w-full`} value={value.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Any</option>
              {CATEGORIES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </Field>
          <Field label="Shipment type">
            <select className={`${ctl} w-full`} value={value.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">Any</option>
              {TYPES.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          </Field>
          <Field label="Dangerous goods">
            <select className={`${ctl} w-full`} value={value.dg} onChange={(e) => set('dg', e.target.value)}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          {scope !== 'client' && (
            <Field label="Source">
              <select className={`${ctl} w-full`} value={value.source} onChange={(e) => set('source', e.target.value)}>
                <option value="">Any</option>
                <option value="website">Website</option>
                <option value="sheet">Sheet / Ops</option>
              </select>
            </Field>
          )}
        </div>
      )}

      {/* Active chips + count */}
      {(chips.length > 0 || resultCount !== null) && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          {chips.map((c, i) => (
            <Chip key={i} label={c.label} onRemove={c.onRemove} />
          ))}
          {resultCount !== null && (
            <span className="ml-auto text-sm text-gray-500">
              {resultCount} shipment{resultCount === 1 ? '' : 's'}
              {capped && ' (first 500)'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
