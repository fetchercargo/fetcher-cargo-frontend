'use client';

import { useState } from 'react';
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from '@headlessui/react';
import type { ClientOption } from '@/lib/admin';

const inputCls =
  'w-full px-3.5 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';

/**
 * ClientCombobox is the "book on behalf of" picker: a dropdown that also filters
 * as you type. It matches on name, client code AND email, because an admin
 * looking a client up may only remember one of the three.
 *
 * The selected value is the client CODE, matching what the booking endpoints
 * expect, so this is a drop-in replacement for the plain <select> it succeeded.
 */
export default function ClientCombobox({
  clients,
  value,
  onChange,
  required,
  placeholder = 'Search by name, code or email…',
}: {
  clients: ClientOption[];
  value: string;
  onChange: (clientCode: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState('');

  const selected = clients.find((c) => c.clientCode === value) ?? null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? clients.filter((c) =>
        `${c.name} ${c.clientCode} ${c.email}`.toLowerCase().includes(q),
      )
    : clients;

  return (
    <Combobox
      value={selected}
      onChange={(c: ClientOption | null) => onChange(c?.clientCode ?? '')}
      onClose={() => setQuery('')}
      immediate
    >
      <div className="relative">
        {/* Native `required` on the visible input would only check that
            SOMETHING was typed — a query with no match passes it. This hidden
            input carries the actual selection, so the browser blocks submit
            until a client is chosen, exactly as the <select> it replaced did. */}
        {required && (
          <input
            tabIndex={-1}
            aria-hidden="true"
            required
            value={value}
            onChange={() => {}}
            className="sr-only pointer-events-none"
            style={{ position: 'absolute', bottom: 0, left: '50%', width: 1, height: 1, opacity: 0 }}
          />
        )}
        <ComboboxInput
          className={inputCls}
          placeholder={placeholder}
          // Once chosen, show the full label; while typing, show the query.
          displayValue={(c: ClientOption | null) =>
            c ? `${c.name} — ${c.clientCode}` : ''
          }
          onChange={(e) => setQuery(e.target.value)}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-brand-dark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </ComboboxButton>

        <ComboboxOptions
          anchor="bottom start"
          className="z-50 w-[var(--input-width)] mt-1 max-h-64 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg p-1 empty:invisible"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-gray-400">No client matches “{query}”.</div>
          )}
          {filtered.map((c) => (
            <ComboboxOption
              key={c.clientCode}
              value={c}
              className="cursor-pointer rounded px-3 py-2 text-sm data-[focus]:bg-orange-50 data-[selected]:bg-orange-50"
            >
              <div className="font-medium text-brand-dark">
                {c.name} <span className="text-gray-500">— {c.clientCode}</span>
              </div>
              {c.email && <div className="text-xs text-gray-400 truncate">{c.email}</div>}
            </ComboboxOption>
          ))}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}
