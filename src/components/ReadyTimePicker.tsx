'use client';

import { Listbox, ListboxButton, ListboxLabel, ListboxOption, ListboxOptions } from '@headlessui/react';

export type ReadyTimeParts = {
  hour: string;
  minute: string;
  period: string;
};

const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periods = ['AM', 'PM'];

function TimePart({
  id,
  label,
  value,
  options,
  onChange,
  invalid,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  invalid: boolean;
}) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="min-w-0">
        <ListboxLabel className="mb-1 block text-xs font-medium text-gray-600">{label}</ListboxLabel>
        <ListboxButton
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? 'readyTime-error' : undefined}
          className={`flex w-full items-center justify-between gap-1 rounded-lg border bg-white px-3 py-3 text-base transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent ${invalid ? 'border-red-400' : 'border-gray-300'}`}
        >
          <span className={value ? 'text-brand-dark' : 'text-gray-400'}>{value || (label === 'Hour' ? 'HH' : label === 'Minute' ? 'MM' : label)}</span>
          <svg className="shrink-0 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </ListboxButton>
        <ListboxOptions
          anchor="bottom start"
          modal={false}
          className="z-50 w-[var(--button-width)] max-h-56! overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {options.map((option) => (
            <ListboxOption
              key={option}
              value={option}
              className="cursor-pointer rounded-md px-3 py-2 text-base text-brand-dark data-[focus]:bg-orange-50 data-[selected]:bg-orange-50 data-[selected]:font-semibold"
            >
              {option}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

export default function ReadyTimePicker({
  value,
  onChange,
  invalid = false,
}: {
  value: ReadyTimeParts;
  onChange: (value: ReadyTimeParts) => void;
  invalid?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-brand-dark">Ready time</legend>
      <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2">
        <TimePart id="readyTime-hour" label="Hour" value={value.hour} options={hours} onChange={(hour) => onChange({ ...value, hour })} invalid={invalid && !value.hour} />
        <TimePart id="readyTime-minute" label="Minute" value={value.minute} options={minutes} onChange={(minute) => onChange({ ...value, minute })} invalid={invalid && !value.minute} />
        <TimePart id="readyTime-period" label="AM/PM" value={value.period} options={periods} onChange={(period) => onChange({ ...value, period })} invalid={invalid && !value.period} />
      </div>
      {invalid && <p id="readyTime-error" className="mt-1.5 text-xs text-red-700">Choose an hour, minute and AM or PM.</p>}
    </fieldset>
  );
}
