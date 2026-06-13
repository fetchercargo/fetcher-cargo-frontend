'use client';

import { useState } from 'react';
import { emptyLocation, type ClientLocationInput } from '@/lib/admin';
import { BrandDots } from '@/components/BrandLoader';
import LocationRows from '@/components/admin/LocationRows';

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-transparent transition-shadow';
const labelCls = 'text-sm font-medium text-brand-dark';

export interface ClientFormState {
  email: string;
  name: string;
  role: string;
  clientCode: string;
  businessName: string;
  businessAddress: string;
  businessEmail: string;
  primaryTel: string;
  primaryContactPerson: string;
  pickups: ClientLocationInput[];
  deliveries: ClientLocationInput[];
}

const DEFAULTS: ClientFormState = {
  email: '',
  name: '',
  role: 'user',
  clientCode: '',
  businessName: '',
  businessAddress: '',
  businessEmail: '',
  primaryTel: '',
  primaryContactPerson: '',
  pickups: [emptyLocation()],
  deliveries: [emptyLocation()],
};

function Field({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <label className={labelCls}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-brand-dark">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5 mb-3">{subtitle}</p>}
      <div className={subtitle ? '' : 'mt-4'}>{children}</div>
    </div>
  );
}

/**
 * Onboarding/edit form for a client or admin account. Collects the values and
 * calls onSubmit with the API payload; the page owns the fetch + navigation
 * (mirrors ShipmentForm).
 */
export default function ClientForm({
  mode,
  initial,
  submitting,
  error,
  submitLabel,
  onSubmit,
}: {
  mode: 'create' | 'edit';
  initial?: Partial<ClientFormState>;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const [form, setForm] = useState<ClientFormState>({ ...DEFAULTS, ...initial });
  const [vErr, setVErr] = useState<string | null>(null);
  const isClient = form.role === 'user';
  const isCreate = mode === 'create';

  function set<K extends keyof ClientFormState>(key: K, value: ClientFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setVErr(null);
    if (isClient) {
      if (!form.clientCode.trim()) return setVErr('A client code is required for client accounts.');
      const ok = (l: ClientLocationInput) => l.label.trim() !== '' && l.address.trim() !== '';
      if (!form.pickups.some(ok)) return setVErr('Add at least one pickup location (with a label and address).');
      if (!form.deliveries.some(ok)) return setVErr('Add at least one delivery location (with a label and address).');
    }
    onSubmit({
      ...(isCreate ? { email: form.email } : {}),
      name: form.name,
      role: form.role,
      clientCode: form.clientCode,
      businessName: form.businessName,
      businessAddress: form.businessAddress,
      businessEmail: form.businessEmail,
      primaryTel: form.primaryTel,
      primaryContactPerson: form.primaryContactPerson,
      pickups: isClient ? form.pickups : [],
      deliveries: isClient ? form.deliveries : [],
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Section title="Account">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isCreate ? (
            <Field label="Login email" required>
              <input type="email" className={inputCls} value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
            </Field>
          ) : (
            <Field label="Login email">
              <input className={`${inputCls} bg-gray-50 text-gray-500`} value={form.email} disabled />
            </Field>
          )}
          <Field label="Name" required>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Role" required>
            <select className={inputCls} value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="user">Client</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Client code" required={isClient}>
            <input className={inputCls} value={form.clientCode} onChange={(e) => set('clientCode', e.target.value)} placeholder="e.g. FCC0002" />
          </Field>
          {isCreate && (
            <p className="text-xs text-gray-400 sm:col-span-2">A temporary password is generated automatically and emailed to the user on creation.</p>
          )}
        </div>
      </Section>

      {isClient && (
        <>
          <Section title="Business profile">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business name">
                <input className={inputCls} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
              </Field>
              <Field label="Business email">
                <input className={inputCls} value={form.businessEmail} onChange={(e) => set('businessEmail', e.target.value)} />
              </Field>
              <Field label="Primary tel">
                <input className={inputCls} value={form.primaryTel} onChange={(e) => set('primaryTel', e.target.value)} />
              </Field>
              <Field label="Primary contact person">
                <input className={inputCls} value={form.primaryContactPerson} onChange={(e) => set('primaryContactPerson', e.target.value)} />
              </Field>
              <Field label="Address" full>
                <textarea rows={2} className={inputCls} value={form.businessAddress} onChange={(e) => set('businessAddress', e.target.value)} />
              </Field>
            </div>
          </Section>

          <Section title="Pickup locations" subtitle="At least one is required.">
            <LocationRows kind="pickup" rows={form.pickups} onChange={(rows) => set('pickups', rows)} />
          </Section>
          <Section title="Delivery locations" subtitle="At least one is required.">
            <LocationRows kind="delivery" rows={form.deliveries} onChange={(rows) => set('deliveries', rows)} />
          </Section>
        </>
      )}

      {(vErr || error) && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{vErr || error}</div>}

      <div className="flex justify-end">
        <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-brand-orange text-white text-sm font-semibold rounded-lg hover:bg-brand-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <BrandDots /> Saving…
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
